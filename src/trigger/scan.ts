import { task } from "@trigger.dev/sdk/v3";

import { fetchRepoFiles } from "@/lib/github/fetcher";
import { childLogger } from "@/lib/logger";
import { runComplianceScan } from "@/lib/scanner";
import { filterRepoFiles } from "@/lib/scanner/filter";
import { loadScanContext, persistScanResults, updateScanProgress } from "@/lib/scanner/persist";

const log = childLogger({ component: "trigger:scan" });

export type ScanJobPayload = {
  readonly scanId: string;
  readonly userId: string;
  readonly repoId: string;
};

// Exported for unit tests; the Trigger.dev wrapper below delegates here.
export async function runScanJobBody(payload: ScanJobPayload): Promise<void> {
  try {
    const ctx = await loadScanContext(payload.scanId);

    await updateScanProgress(payload.scanId, { phase: "fetching" });
    const fetched = await fetchRepoFiles(ctx.installationId, ctx.owner, ctx.name, {
      cacheRepoId: ctx.repoId,
    });

    await updateScanProgress(payload.scanId, { phase: "filtering" });
    const filtered = filterRepoFiles(
      fetched.files.map((f) => ({ path: f.path, size: f.size, content: f.content })),
    );

    const result = await runComplianceScan({
      files: filtered,
      frameworks: ["gdpr"],
      scanId: payload.scanId,
      userId: payload.userId,
      onPhase: (phase, done, total) => {
        if (phase === "deep_scan") {
          void updateScanProgress(payload.scanId, {
            phase: "deep_scan",
            filesDone: done ?? 0,
            filesTotal: total ?? 0,
          });
          return;
        }
        void updateScanProgress(payload.scanId, { phase });
      },
    });

    await persistScanResults(payload.scanId, {
      kind: "completed",
      score: result.score,
      findings: result.findings,
      stats: result.stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log.error({ err, scanId: payload.scanId }, "scan job failed");
    await persistScanResults(payload.scanId, {
      kind: "failed",
      failureReason: classifyFailure(message),
    });
    throw err;
  }
}

function classifyFailure(message: string): string {
  if (/401|403|installation/i.test(message)) return "github_auth";
  if (/timeout|aborted/i.test(message)) return "timeout";
  return "unknown";
}

export const runScanJob = task({
  id: "themida-scan",
  maxDuration: 300,
  run: runScanJobBody,
});
