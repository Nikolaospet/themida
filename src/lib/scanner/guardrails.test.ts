// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  assertAndConsumeUserDailyCap,
  assertGlobalSpendUnderCap,
  assertNoActiveScanForRepo,
  DailyCapExceededError,
  KillSwitchTrippedError,
  ScanAlreadyRunningError,
} from "./guardrails";

// Helpers to build a mock supabase admin client.
type Builder = {
  data?: unknown;
  error?: unknown;
};

function makeAdmin(handlers: Record<string, (args: unknown[]) => Builder>) {
  const calls: { name: string; args: unknown[] }[] = [];
  return {
    _calls: calls,
    rpc: vi.fn((name: string, args?: unknown) => {
      calls.push({ name: `rpc:${name}`, args: [args] });
      const h = handlers[`rpc:${name}`];
      return Promise.resolve(h ? h([args]) : { data: null, error: null });
    }),
    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn(() => {
        calls.push({ name: `from:${table}:maybeSingle`, args: [] });
        const h = handlers[`from:${table}:maybeSingle`];
        return Promise.resolve(h ? h([]) : { data: null, error: null });
      }),
      single: vi.fn(() => {
        calls.push({ name: `from:${table}:single`, args: [] });
        const h = handlers[`from:${table}:single`];
        return Promise.resolve(h ? h([]) : { data: null, error: null });
      }),
    })),
  };
}

describe("assertGlobalSpendUnderCap", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("passes when spend is below the cap", async () => {
    vi.stubEnv("MAX_DAILY_SPEND_CENTS", "1000");
    const admin = makeAdmin({
      "rpc:sum_llm_cost_last_24h": () => ({ data: 500, error: null }),
    });
    await expect(assertGlobalSpendUnderCap(admin as never)).resolves.toBeUndefined();
  });

  it("throws when spend equals or exceeds the cap", async () => {
    vi.stubEnv("MAX_DAILY_SPEND_CENTS", "1000");
    const admin = makeAdmin({
      "rpc:sum_llm_cost_last_24h": () => ({ data: 1000, error: null }),
    });
    await expect(assertGlobalSpendUnderCap(admin as never)).rejects.toBeInstanceOf(
      KillSwitchTrippedError,
    );
  });

  it("treats a null result as zero spend", async () => {
    vi.stubEnv("MAX_DAILY_SPEND_CENTS", "1000");
    const admin = makeAdmin({
      "rpc:sum_llm_cost_last_24h": () => ({ data: null, error: null }),
    });
    await expect(assertGlobalSpendUnderCap(admin as never)).resolves.toBeUndefined();
  });
});

describe("assertAndConsumeUserDailyCap", () => {
  it("allows the first scan of the window and increments to 1", async () => {
    const admin = makeAdmin({
      "rpc:consume_daily_scan_slot": () => ({
        data: { allowed: true, scans_in_window: 1 },
        error: null,
      }),
    });
    await expect(
      assertAndConsumeUserDailyCap(admin as never, "user-1", { cap: 3 }),
    ).resolves.toEqual({ scansInWindow: 1 });
  });

  it("rejects once scans_in_window reaches the cap", async () => {
    const admin = makeAdmin({
      "rpc:consume_daily_scan_slot": () => ({
        data: { allowed: false, scans_in_window: 3 },
        error: null,
      }),
    });
    await expect(
      assertAndConsumeUserDailyCap(admin as never, "user-1", { cap: 3 }),
    ).rejects.toBeInstanceOf(DailyCapExceededError);
  });
});

describe("assertNoActiveScanForRepo", () => {
  it("passes when no pending/running scans exist", async () => {
    const admin = makeAdmin({
      "from:scans:maybeSingle": () => ({ data: null, error: null }),
    });
    await expect(assertNoActiveScanForRepo(admin as never, "repo-1")).resolves.toBeUndefined();
  });

  it("throws when a pending or running scan exists", async () => {
    const admin = makeAdmin({
      "from:scans:maybeSingle": () => ({
        data: { id: "scan-1", status: "running" },
        error: null,
      }),
    });
    await expect(assertNoActiveScanForRepo(admin as never, "repo-1")).rejects.toBeInstanceOf(
      ScanAlreadyRunningError,
    );
  });
});
