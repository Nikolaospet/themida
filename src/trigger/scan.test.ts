// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

// Mocks must be set up before importing the task module. Use vi.hoisted so
// the mock fns are initialized before vi.mock factories (which are hoisted).
const {
  fetchRepoFilesMock,
  filterRepoFilesMock,
  runComplianceScanMock,
  loadScanContextMock,
  updateScanProgressMock,
  persistScanResultsMock,
} = vi.hoisted(() => ({
  fetchRepoFilesMock: vi.fn(),
  filterRepoFilesMock: vi.fn(),
  runComplianceScanMock: vi.fn(),
  loadScanContextMock: vi.fn(),
  updateScanProgressMock: vi.fn(),
  persistScanResultsMock: vi.fn(),
}));

vi.mock("@/lib/github/fetcher", () => ({ fetchRepoFiles: fetchRepoFilesMock }));
vi.mock("@/lib/scanner/filter", () => ({ filterRepoFiles: filterRepoFilesMock }));
vi.mock("@/lib/scanner", () => ({ runComplianceScan: runComplianceScanMock }));
vi.mock("@/lib/scanner/persist", () => ({
  loadScanContext: loadScanContextMock,
  updateScanProgress: updateScanProgressMock,
  persistScanResults: persistScanResultsMock,
}));

// Import after mocks are set.
import { runScanJobBody } from "./scan";

describe("runScanJobBody", () => {
  it("writes progress at each phase and persists the result", async () => {
    loadScanContextMock.mockResolvedValue({
      installationId: 1,
      owner: "octo",
      name: "demo",
      repoId: "repo-1",
      frameworks: ["gdpr", "mica"],
    });
    fetchRepoFilesMock.mockResolvedValue({
      treeSha: "abc",
      files: [{ path: "a.ts", sha: "s1", size: 1, content: "x" }],
      stats: {
        treeSha: "abc",
        treeFiles: 1,
        fetched: 1,
        cached: 0,
        totalBytes: 1,
        durationMs: 1,
      },
    });
    filterRepoFilesMock.mockReturnValue([{ path: "a.ts", content: "x", size: 1, score: 5 }]);
    runComplianceScanMock.mockImplementation(async (input) => {
      input.onPhase?.("recon");
      input.onPhase?.("deep_scan", 1, 1);
      input.onPhase?.("verifying");
      input.onPhase?.("done");
      return {
        findings: [],
        score: 100,
        stats: {
          filesScanned: 1,
          chunks: 1,
          findingsRaw: 0,
          findingsVerified: 0,
          durationMs: 10,
        },
      };
    });

    await runScanJobBody({ scanId: "scan-1", userId: "user-1", repoId: "repo-1" });

    expect(runComplianceScanMock).toHaveBeenCalledWith(
      expect.objectContaining({ frameworks: ["gdpr", "mica"] }),
    );
    const phases = updateScanProgressMock.mock.calls.map((c) => (c[1] as { phase: string }).phase);
    expect(phases).toEqual(["fetching", "filtering", "recon", "deep_scan", "verifying", "done"]);
    expect(persistScanResultsMock).toHaveBeenCalledWith(
      "scan-1",
      expect.objectContaining({ kind: "completed", score: 100 }),
    );
  });

  it("marks the scan failed when the pipeline throws", async () => {
    loadScanContextMock.mockResolvedValue({
      installationId: 1,
      owner: "octo",
      name: "demo",
      repoId: "repo-2",
      frameworks: ["gdpr"],
    });
    fetchRepoFilesMock.mockRejectedValue(new Error("github 401"));
    await expect(
      runScanJobBody({ scanId: "scan-2", userId: "user-2", repoId: "repo-2" }),
    ).rejects.toThrow();
    expect(persistScanResultsMock).toHaveBeenCalledWith(
      "scan-2",
      expect.objectContaining({ kind: "failed", failureReason: expect.any(String) }),
    );
  });
});
