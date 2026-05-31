"use server";

import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { loadRepoForUser } from "@/lib/repos/access";
import { type Framework, listFrameworks } from "@/lib/rules";
import { parseFrameworksSelection } from "@/lib/rules/parse-frameworks";
import {
  assertAndConsumeUserDailyCap,
  assertGlobalSpendUnderCap,
  assertNoActiveScanForRepo,
} from "@/lib/scanner/guardrails";
import { insertScan } from "@/lib/scanner/persist";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runScanJob } from "@/trigger/scan";

export async function startScan(
  repoId: string,
  frameworks: readonly Framework[] = listFrameworks(),
): Promise<{ scanId: string }> {
  const user = await requireUser();
  const repo = await loadRepoForUser(repoId, user.id);
  if (!repo) notFound();

  const admin = createSupabaseAdminClient();

  // Guardrail order: kill switch first (cheapest reject), then concurrency
  // (so a double-click doesn't burn a daily slot), then daily cap (which
  // consumes state).
  await assertGlobalSpendUnderCap(admin);
  await assertNoActiveScanForRepo(admin, repoId);
  await assertAndConsumeUserDailyCap(admin, user.id, undefined);

  const scan = await insertScan({
    repoId,
    userId: user.id,
    frameworks: [...frameworks],
  });

  await runScanJob.trigger({
    scanId: scan.id,
    userId: user.id,
    repoId,
  });

  return { scanId: scan.id };
}

/**
 * Form-friendly wrapper. Maps guardrail errors to query-string codes
 * (consumed by RepoDetailPage and surfaced as toasts client-side) and
 * redirects to the new scan page on success.
 *
 * Note: Next.js redirect() throws — never `return` after it.
 */
export async function startScanFromForm(formData: FormData): Promise<void> {
  const repoId = formData.get("repoId");
  if (typeof repoId !== "string" || repoId.length === 0) {
    redirect("/dashboard?scan_error=invalid_repo");
  }

  const rawFrameworks = formData
    .getAll("frameworks")
    .filter((value): value is string => typeof value === "string");

  let frameworks: Framework[];
  try {
    frameworks = parseFrameworksSelection(rawFrameworks);
  } catch {
    redirect(`/repos/${repoId}?scan_error=invalid_frameworks`);
  }

  try {
    const { scanId } = await startScan(repoId, frameworks);
    redirect(`/scan/${scanId}`);
  } catch (err) {
    // Next's redirect() throws a special error — let it propagate.
    if (err && typeof err === "object" && "digest" in err) throw err;

    const code = errorCode(err);
    redirect(`/repos/${repoId}?scan_error=${code}`);
  }
}

function errorCode(err: unknown): string {
  if (!(err instanceof Error)) return "unknown";
  switch (err.name) {
    case "DailyCapExceededError":
      return "daily_cap";
    case "KillSwitchTrippedError":
      return "kill_switch";
    case "ScanAlreadyRunningError":
      return "already_running";
    default:
      return "unknown";
  }
}
