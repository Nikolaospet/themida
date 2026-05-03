/* eslint-disable no-console */
import { fetchRepoFiles } from "@/lib/github/fetcher";
import { runComplianceScan } from "@/lib/scanner";
import { filterRepoFiles } from "@/lib/scanner/filter";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function main(): Promise<void> {
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

  console.log(`Scanning ${repo.full_name} (installation ${repo.installation_id})...\n`);

  const fetched = await fetchRepoFiles(repo.installation_id, repo.owner, repo.name, {
    cacheRepoId: repo.id,
  });
  const filtered = filterRepoFiles(
    fetched.files.map((f) => ({ path: f.path, size: f.size, content: f.content })),
  );

  const startedAt = Date.now();
  const result = await runComplianceScan({
    files: filtered,
    frameworks: ["gdpr", "eu-ai-act"],
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
