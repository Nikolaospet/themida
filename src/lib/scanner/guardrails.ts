import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export const DEFAULT_DAILY_CAP = 3;

export class DailyCapExceededError extends Error {
  constructor(public readonly scansInWindow: number) {
    super("daily scan cap exceeded");
    this.name = "DailyCapExceededError";
  }
}

export class KillSwitchTrippedError extends Error {
  constructor(
    public readonly spendCents: number,
    public readonly capCents: number,
  ) {
    super("global daily spend cap exceeded");
    this.name = "KillSwitchTrippedError";
  }
}

export class ScanAlreadyRunningError extends Error {
  constructor(public readonly scanId: string) {
    super("a scan is already running for this repo");
    this.name = "ScanAlreadyRunningError";
  }
}

type Admin = SupabaseClient<Database>;

export async function assertGlobalSpendUnderCap(admin: Admin): Promise<void> {
  const capRaw = process.env.MAX_DAILY_SPEND_CENTS;
  const cap = capRaw ? Number.parseInt(capRaw, 10) : 1000; // default $10, cents are integers
  if (!Number.isInteger(cap) || cap <= 0) return;

  const { data, error } = await admin.rpc("sum_llm_cost_last_24h");
  if (error) throw new Error(`sum_llm_cost_last_24h failed: ${error.message}`);

  const spend = Number(data ?? 0);
  if (spend >= cap) {
    throw new KillSwitchTrippedError(spend, cap);
  }
}

export async function assertAndConsumeUserDailyCap(
  admin: Admin,
  userId: string,
  options: { cap?: number } = {},
): Promise<{ scansInWindow: number }> {
  const cap = options.cap ?? DEFAULT_DAILY_CAP;

  const { data, error } = await admin.rpc("consume_daily_scan_slot", {
    p_user_id: userId,
    p_cap: cap,
  });
  if (error) throw new Error(`consume_daily_scan_slot failed: ${error.message}`);

  const result = data as { allowed: boolean; scans_in_window: number };
  if (!result.allowed) {
    throw new DailyCapExceededError(result.scans_in_window);
  }
  return { scansInWindow: result.scans_in_window };
}

export async function assertNoActiveScanForRepo(admin: Admin, repoId: string): Promise<void> {
  const { data, error } = await admin
    .from("scans")
    .select("id, status")
    .eq("repo_id", repoId)
    .in("status", ["pending", "running"])
    .maybeSingle();
  if (error) throw new Error(`active scan lookup failed: ${error.message}`);
  if (data) throw new ScanAlreadyRunningError(data.id);
}
