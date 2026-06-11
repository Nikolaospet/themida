import "server-only";

import type { IssueCardData } from "@/components/dashboard/IssueCard";
import type { VerifiedFinding } from "@/lib/scanner/findings";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];
type IssueRow = Database["public"]["Tables"]["issues"]["Row"];

/** Columns needed to render both the SARIF and PDF exports. */
const EXPORT_ISSUE_COLUMNS =
  "id, severity, rule_id, title, file_path, line_number, code_snippet, explanation, legal_reference, legal_risk, fix_description, fix_code, fix_time_estimate, framework";

export type ScanExportData = {
  readonly scan: ScanRow;
  readonly repoFullName: string;
  readonly defaultBranch: string;
  readonly issues: IssueCardData[];
  readonly findings: VerifiedFinding[];
};

export function issueRowToCardData(row: IssueRow): IssueCardData {
  return {
    id: row.id,
    severity: row.severity,
    rule_id: row.rule_id,
    title: row.title,
    file_path: row.file_path,
    line_number: row.line_number,
    code_snippet: row.code_snippet,
    explanation: row.explanation,
    legal_reference: row.legal_reference,
    legal_risk: row.legal_risk,
    fix_description: row.fix_description,
    fix_code: row.fix_code,
    fix_time_estimate: row.fix_time_estimate,
  };
}

// The SARIF exporter only reads rule_id/framework/file_path/line_number/
// code_snippet/title/explanation/severity; the remaining VerifiedFinding fields
// are required by the type but unused here, so nullable columns coerce to "".
export function issueRowToFinding(row: IssueRow): VerifiedFinding {
  return {
    rule_id: row.rule_id,
    framework: row.framework,
    file_path: row.file_path,
    line_number: row.line_number,
    code_snippet: row.code_snippet ?? "",
    title: row.title,
    explanation: row.explanation,
    severity: row.severity,
    legal_reference: row.legal_reference ?? "",
    legal_risk: row.legal_risk ?? "",
    fix_description: row.fix_description ?? "",
    fix_code: row.fix_code ?? "",
    fix_time_estimate: row.fix_time_estimate ?? "",
    confidence: "HIGH",
  };
}

/**
 * Load a completed scan and its findings for export, enforcing that the scan
 * belongs to the signed-in user. Returns `null` for an unauthenticated request,
 * a scan that the user does not own, a missing repo, or a scan that has not
 * completed — callers should surface all of these as a 404 so the endpoint does
 * not leak the existence of other users' scans.
 */
export async function loadScanExport(scanId: string): Promise<ScanExportData | null> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!scan || scan.status !== "completed") return null;

  const { data: repo } = await supabase
    .from("repos")
    .select("full_name, default_branch")
    .eq("id", scan.repo_id)
    .maybeSingle();
  if (!repo) return null;

  const { data: rows } = await supabase
    .from("issues")
    .select(EXPORT_ISSUE_COLUMNS)
    .eq("scan_id", scanId);

  const issueRows = (rows ?? []) as IssueRow[];

  return {
    scan,
    repoFullName: repo.full_name,
    defaultBranch: repo.default_branch,
    issues: issueRows.map(issueRowToCardData),
    findings: issueRows.map(issueRowToFinding),
  };
}
