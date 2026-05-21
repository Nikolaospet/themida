/* eslint-disable no-console */
import { writeFileSync } from "node:fs";
import { parseArgs } from "node:util";

import { fetchRepoFiles } from "@/lib/github/fetcher";
import { listFrameworks } from "@/lib/rules";
import { parseFrameworksArg } from "@/lib/rules/parse-frameworks";
import { runComplianceScan } from "@/lib/scanner";
import { toSarifString } from "@/lib/scanner/exporters/sarif";
import { filterRepoFiles } from "@/lib/scanner/filter";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function main(): Promise<void> {
  const { values } = parseArgs({
    options: {
      frameworks: { type: "string" },
      format: { type: "string" },
      out: { type: "string" },
    },
  });
  const format = values.format ?? "text";
  if (format !== "text" && format !== "sarif") {
    throw new Error(`unknown --format '${format}': expected 'text' or 'sarif'`);
  }
  if (format === "sarif" && !values.out) {
    throw new Error("--format sarif requires --out <file> (e.g. --out themida.sarif)");
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

  console.log(
    `Scanning ${repo.full_name} (installation ${repo.installation_id}) — frameworks: ${frameworks.join(", ")}...\n`,
  );

  const fetched = await fetchRepoFiles(repo.installation_id, repo.owner, repo.name, {
    cacheRepoId: repo.id,
  });
  const filtered = filterRepoFiles(
    fetched.files.map((f) => ({ path: f.path, size: f.size, content: f.content })),
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
