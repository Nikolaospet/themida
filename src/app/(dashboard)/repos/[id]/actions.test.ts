// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireUserMock,
  loadRepoForUserMock,
  insertScanMock,
  triggerMock,
  assertGlobalSpendUnderCapMock,
  assertAndConsumeUserDailyCapMock,
  assertNoActiveScanForRepoMock,
} = vi.hoisted(() => ({
  requireUserMock: vi.fn(),
  loadRepoForUserMock: vi.fn(),
  insertScanMock: vi.fn(),
  triggerMock: vi.fn(),
  assertGlobalSpendUnderCapMock: vi.fn(),
  assertAndConsumeUserDailyCapMock: vi.fn(),
  assertNoActiveScanForRepoMock: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireUser: requireUserMock }));
vi.mock("@/lib/repos/access", () => ({ loadRepoForUser: loadRepoForUserMock }));
vi.mock("@/lib/scanner/persist", () => ({ insertScan: insertScanMock }));
vi.mock("@/trigger/scan", () => ({ runScanJob: { trigger: triggerMock } }));
vi.mock("@/lib/scanner/guardrails", () => ({
  assertGlobalSpendUnderCap: assertGlobalSpendUnderCapMock,
  assertAndConsumeUserDailyCap: assertAndConsumeUserDailyCapMock,
  assertNoActiveScanForRepo: assertNoActiveScanForRepoMock,
  DailyCapExceededError: class DailyCapExceededError extends Error {},
  KillSwitchTrippedError: class KillSwitchTrippedError extends Error {},
  ScanAlreadyRunningError: class ScanAlreadyRunningError extends Error {},
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: () => ({}) }));

import { startScan } from "./actions";

describe("startScan", () => {
  beforeEach(() => {
    requireUserMock.mockReset();
    loadRepoForUserMock.mockReset();
    insertScanMock.mockReset();
    triggerMock.mockReset();
    assertGlobalSpendUnderCapMock.mockReset();
    assertAndConsumeUserDailyCapMock.mockReset();
    assertNoActiveScanForRepoMock.mockReset();
  });

  it("inserts a scan and enqueues the job on the happy path", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    loadRepoForUserMock.mockResolvedValue({ id: "repo-1", fullName: "octo/demo" });
    assertGlobalSpendUnderCapMock.mockResolvedValue(undefined);
    assertAndConsumeUserDailyCapMock.mockResolvedValue({ scansInWindow: 1 });
    assertNoActiveScanForRepoMock.mockResolvedValue(undefined);
    insertScanMock.mockResolvedValue({ id: "scan-1" });
    triggerMock.mockResolvedValue({ id: "task-1" });

    const result = await startScan("repo-1");

    expect(result).toEqual({ scanId: "scan-1" });
    expect(assertGlobalSpendUnderCapMock).toHaveBeenCalled();
    expect(assertAndConsumeUserDailyCapMock).toHaveBeenCalledWith(
      expect.anything(),
      "user-1",
      undefined,
    );
    expect(assertNoActiveScanForRepoMock).toHaveBeenCalledWith(expect.anything(), "repo-1");
    expect(triggerMock).toHaveBeenCalledWith({
      scanId: "scan-1",
      userId: "user-1",
      repoId: "repo-1",
    });
  });

  it("does not consume a slot when kill switch trips", async () => {
    requireUserMock.mockResolvedValue({ id: "user-1" });
    loadRepoForUserMock.mockResolvedValue({ id: "repo-1", fullName: "octo/demo" });
    assertGlobalSpendUnderCapMock.mockRejectedValueOnce(new Error("KillSwitchTrippedError"));

    await expect(startScan("repo-1")).rejects.toThrow();
    expect(assertAndConsumeUserDailyCapMock).not.toHaveBeenCalled();
    expect(triggerMock).not.toHaveBeenCalled();
  });
});
