/* eslint-disable no-console */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { fetchRepoFiles } from "@/lib/github/fetcher";
import { getPullRequestFilePaths } from "@/lib/github/pr-files";
import { listFrameworks } from "@/lib/rules";
import { parseFrameworksArg } from "@/lib/rules/parse-frameworks";
import { runComplianceScan } from "@/lib/scanner";
import { localDiffPaths } from "@/lib/scanner/diff";
import { toSarifString } from "@/lib/scanner/exporters/sarif";
import { filterRepoFiles } from "@/lib/scanner/filter";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      frameworks: { type: "string" },
      format: { type: "string" },
      out: { type: "string" },
      diff: { type: "string" },
      "github-pr": { type: "string" },
    },
  });
  const format = values.format ?? "text";
  if (format !== "text" && format !== "sarif") {
    throw new Error(`unknown --format '${format}': expected 'text' or 'sarif'`);
  }
  if (format === "sarif" && !values.out) {
    throw new Error("--format sarif requires --out <file> (e.g. --out themida.sarif)");
  }
  if (values.diff && values["github-pr"]) {
    throw new Error("pass either --diff <base..head> or --github-pr <number>, not both");
  }
  const prNumber = values["github-pr"] ? Number(values["github-pr"]) : undefined;
  if (prNumber !== undefined && !Number.isInteger(prNumber)) {
    throw new Error(`--github-pr expects an integer, got '${values["github-pr"]}'`);
  }
  // No flag → scan every registered pack. `--frameworks gdpr,mica` restricts
  // to a validated subset (parseFrameworksArg throws on unknown ids).
  const frameworks = values.frameworks ? parseFrameworksArg(values.frameworks) : listFrameworks();

  const admin = createSupabaseAdminClient();

  const { data: repo, error } = await admin
    .from("repos")
    .select("id, owner, name, full_name, installation_id")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!repo || !repo.installation_id) {
    console.error("No connected repo found. Connect one via /repos/connect first.");
    process.exit(1);
  }

  // Diff mode: restrict the scan to files a PR/branch touched. `--diff` reads a
  // local git range; `--github-pr` reads the PR's changed files from the API.
  let diffPaths: Set<string> | undefined;
  if (values.diff) {
    diffPaths = localDiffPaths(values.diff);
  } else if (prNumber !== undefined) {
    diffPaths = await getPullRequestFilePaths(
      repo.installation_id,
      repo.owner,
      repo.name,
      prNumber,
    );
  }

  const scope = values.diff
    ? `diff ${values.diff}`
    : prNumber !== undefined
      ? `PR #${prNumber}`
      : "full repo";
  console.log(
    `Scanning ${repo.full_name} (installation ${repo.installation_id}) — ${scope} — frameworks: ${frameworks.join(", ")}...`,
  );
  if (diffPaths) console.log(`Diff scope: ${diffPaths.size} changed file(s).`);
  console.log();

  if (diffPaths && diffPaths.size === 0) {
    console.log("No changed files in the diff; nothing to scan.");
    return;
  }

  const fetched = await fetchRepoFiles(repo.installation_id, repo.owner, repo.name, {
    cacheRepoId: repo.id,
    // Only download the changed blobs when in diff mode (the real token/bandwidth win).
    ...(diffPaths ? { paths: [...diffPaths] } : {}),
  });
  const filtered = filterRepoFiles(
    fetched.files.map((f) => ({ path: f.path, size: f.size, content: f.content })),
    // The filter also enforces the diff set, so non-diff files are never scanned.
    diffPaths ? { diffPaths } : {},
  );

  const startedAt = Date.now();
  const result = await runComplianceScan({
    files: filtered,
    frameworks,
  });
  const duration = Date.now() - startedAt;

  console.log("=== Scan stats ===");
  console.log(`  Filtered files:   ${filtered.length} / ${fetched.files.length}`);
  console.log(`  Files scanned:    ${result.stats.filesScanned}`);
  console.log(`  Chunks:           ${result.stats.chunks}`);
  console.log(`  Findings (raw):   ${result.stats.findingsRaw}`);
  console.log(`  Findings (kept):  ${result.stats.findingsVerified}`);
  console.log(`  Compliance score: ${result.score}`);
  console.log(`  Wall-clock:       ${duration} ms\n`);

  if (format === "sarif") {
    const out = values.out!;
    // Path is an explicit operator-supplied CLI argument, not untrusted input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    writeFileSync(out, toSarifString(result.findings));
    console.log(`Wrote ${result.findings.length} finding(s) to ${out} (SARIF 2.1.0).`);
    console.log("Upload in CI with github/codeql-action/upload-sarif.");
    return;
  }

  if (result.findings.length === 0) {
    console.log("No verified violations.");
    return;
  }

  console.log("=== Top findings ===");
  for (const f of result.findings.slice(0, 20)) {
    const where = f.line_number ? `${f.file_path}:${f.line_number}` : f.file_path;
    console.log(`  [${f.severity}] ${f.rule_id} — ${where}`);
    console.log(`     ${f.title}`);
  }
}

main().catch((err: unknown) => {
  // Print the message cleanly (e.g. the --frameworks validation hint) rather
  // than dumping a stack trace for what is usually a user-input mistake.
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
