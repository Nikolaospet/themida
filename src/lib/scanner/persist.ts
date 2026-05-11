import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import type { ScanResult, VerifiedFinding } from "./findings";
import { type ScanProgress, serializeProgress } from "./progress";

export type ScanContext = {
  readonly installationId: number;
  readonly owner: string;
  readonly name: string;
  readonly repoId: string;
};

export async function loadScanContext(scanId: string): Promise<ScanContext> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("scans")
    .select("repo:repos!inner(id, owner, name, installation_id)")
    .eq("id", scanId)
    .single();
  if (error || !data) {
    throw new Error(`scan ${scanId} not found: ${error?.message ?? "unknown"}`);
  }
  // Supabase typegen returns nested relations as either an object or array
  // depending on schema cardinality — normalize defensively.
  const repo = Array.isArray(data.repo) ? data.repo[0] : data.repo;
  if (!repo) throw new Error(`scan ${scanId} has no repo`);
  if (repo.installation_id === null || repo.installation_id === undefined) {
    throw new Error(`repo ${repo.owner}/${repo.name} has no installation_id`);
  }
  return {
    installationId: Number(repo.installation_id),
    owner: repo.owner,
    name: repo.name,
    repoId: repo.id,
  };
}

export async function updateScanProgress(scanId: string, progress: ScanProgress): Promise<void> {
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from("scans")
    .update({ progress: serializeProgress(progress) })
    .eq("id", scanId);
  if (error) throw new Error(`progress update failed: ${error.message}`);
}

export type PersistResult =
  | {
      kind: "completed";
      userId: string;
      score: number;
      findings: readonly VerifiedFinding[];
      stats: ScanResult["stats"];
    }
  | { kind: "failed"; userId: string; failureReason: string };

export async function persistScanResults(scanId: string, result: PersistResult): Promise<void> {
  const admin = createSupabaseAdminClient();

  if (result.kind === "completed") {
    const { error: scanErr } = await admin
      .from("scans")
      .update({
        status: "completed",
        compliance_score: result.score,
        total_issues: result.findings.length,
        critical_count: result.findings.filter((f) => f.severity === "CRITICAL").length,
        high_count: result.findings.filter((f) => f.severity === "HIGH").length,
        medium_count: result.findings.filter((f) => f.severity === "MEDIUM").length,
        low_count: result.findings.filter((f) => f.severity === "LOW").length,
        files_scanned: result.stats.filesScanned,
        completed_at: new Date().toISOString(),
        progress: serializeProgress({ phase: "done" }),
      })
      .eq("id", scanId);
    if (scanErr) throw new Error(`scan finalize failed: ${scanErr.message}`);

    if (result.findings.length === 0) return;

    // VerifiedFinding fields are already snake_case matching the `issues` columns.
    const rows = result.findings.map((f) => ({
      scan_id: scanId,
      user_id: result.userId,
      rule_id: f.rule_id,
      framework: f.framework,
      file_path: f.file_path,
      line_number: f.line_number,
      code_snippet: f.code_snippet,
      title: f.title,
      explanation: f.explanation,
      severity: f.severity,
      legal_reference: f.legal_reference,
      legal_risk: f.legal_risk,
      fix_description: f.fix_description,
      fix_code: f.fix_code,
      fix_time_estimate: f.fix_time_estimate,
      confidence: f.confidence,
    }));
    const { error: issuesErr } = await admin.from("issues").insert(rows);
    if (issuesErr) throw new Error(`issues insert failed: ${issuesErr.message}`);
  } else {
    const { error } = await admin
      .from("scans")
      .update({
        status: "failed",
        error_message: result.failureReason,
        completed_at: new Date().toISOString(),
      })
      .eq("id", scanId);
    if (error) throw new Error(`scan failed-state update failed: ${error.message}`);
  }
}
