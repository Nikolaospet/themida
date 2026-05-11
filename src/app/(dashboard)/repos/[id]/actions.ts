"use server";

import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { loadRepoForUser } from "@/lib/repos/access";
import {
  assertAndConsumeUserDailyCap,
  assertGlobalSpendUnderCap,
  assertNoActiveScanForRepo,
} from "@/lib/scanner/guardrails";
import { insertScan } from "@/lib/scanner/persist";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runScanJob } from "@/trigger/scan";

export async function startScan(repoId: string): Promise<{ scanId: string }> {
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
    frameworks: ["gdpr"],
  });

  await runScanJob.trigger({
    scanId: scan.id,
    userId: user.id,
    repoId,
  });

  return { scanId: scan.id };
}
