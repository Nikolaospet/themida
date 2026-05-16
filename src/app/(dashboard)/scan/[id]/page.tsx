import { notFound, redirect } from "next/navigation";

import type { IssueCardData } from "@/components/dashboard/IssueCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { startScan } from "../../repos/[id]/actions";
import { ScanFailed } from "./ScanFailed";
import { ScanProgress } from "./ScanProgress";
import { ScanResults } from "./ScanResults";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScanPage({ params }: Props) {
  const { id: scanId } = await params;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: scan } = await supabase
    .from("scans")
    .select("*")
    .eq("id", scanId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!scan) notFound();

  const { data: repo } = await supabase
    .from("repos")
    .select("full_name, default_branch")
    .eq("id", scan.repo_id)
    .maybeSingle();

  if (!repo) notFound();

  if (scan.status === "completed") {
    const { data: issuesRaw } = await supabase
      .from("issues")
      .select(
        "id, severity, rule_id, title, file_path, line_number, code_snippet, explanation, legal_reference, legal_risk, fix_description, fix_code, fix_time_estimate",
      )
      .eq("scan_id", scanId);

    const issues: IssueCardData[] = (issuesRaw ?? []).map((row) => ({
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
    }));

    return (
      <ScanResults
        scan={scan}
        issues={issues}
        repoFullName={repo.full_name}
        defaultBranch={repo.default_branch}
      />
    );
  }

  if (scan.status === "failed") {
    async function retryScan(repoId: string) {
      "use server";
      const { scanId: newId } = await startScan(repoId);
      redirect(`/scan/${newId}`);
    }
    return (
      <ScanFailed errorCode={scan.error_message} repoId={scan.repo_id} retryScan={retryScan} />
    );
  }

  return <ScanProgress scanId={scanId} initialScan={scan} repoFullName={repo.full_name} />;
}
