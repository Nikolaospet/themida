// Server-only by transitive dependency on the OpenRouter client and
// Supabase admin paths. Omitting the explicit `server-only` marker keeps
// this module importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { getRulesForFrameworks, isFramework } from "@/lib/rules";
import type { Framework } from "@/lib/rules/types";

import { chunkFiles } from "./chunker";
import { runDeepScanPass } from "./deep";
import type { ScanResult } from "./findings";
import type { ScanPhase } from "./progress";
import { runReconPass } from "./recon";
import { calculateComplianceScore } from "./score";
import type { ScannerFile } from "./types";
import { runVerificationPass } from "./verify";

const DEEP_CHUNK_TOKENS = 20_000;

export type OrchestratorPhase = Extract<ScanPhase, "recon" | "deep_scan" | "verifying" | "done">;

export type RunComplianceScanInput = {
  readonly files: readonly ScannerFile[];
  readonly frameworks: readonly Framework[];
  readonly scanId?: string | null;
  readonly userId?: string | null;
  readonly onPhase?: (phase: OrchestratorPhase, filesDone?: number, filesTotal?: number) => void;
};

export async function runComplianceScan(input: RunComplianceScanInput): Promise<ScanResult> {
  for (const f of input.frameworks) {
    if (!isFramework(f)) {
      throw new Error(`unknown framework: ${String(f)}`);
    }
  }

  const startedAt = Date.now();
  if (input.files.length === 0 || input.frameworks.length === 0) {
    input.onPhase?.("done");
    return {
      findings: [],
      score: 100,
      stats: {
        filesScanned: 0,
        chunks: 0,
        findingsRaw: 0,
        findingsVerified: 0,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  const rules = getRulesForFrameworks(input.frameworks);
  const llmContext = { scanId: input.scanId ?? null, userId: input.userId ?? null };

  // Pass 2: recon.
  input.onPhase?.("recon");
  const recon = await runReconPass(input.files, rules, llmContext);
  if (recon.topPaths.length === 0) {
    input.onPhase?.("done");
    return {
      findings: [],
      score: 100,
      stats: {
        filesScanned: 0,
        chunks: 0,
        findingsRaw: 0,
        findingsVerified: 0,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  // Narrow files to recon's selection (preserve recon order).
  const byPath = new Map(input.files.map((f) => [f.path, f]));
  const selected: ScannerFile[] = [];
  for (const path of recon.topPaths) {
    const file = byPath.get(path);
    if (file) selected.push(file);
  }

  // Pass 3: deep scan in chunks.
  const chunks = chunkFiles(selected, { maxTokensPerChunk: DEEP_CHUNK_TOKENS });
  input.onPhase?.("deep_scan", 0, chunks.length);
  const raw = await runDeepScanPass(chunks, rules, {
    ...llmContext,
    onChunkComplete: (done, total) => input.onPhase?.("deep_scan", done, total),
  });

  // Pass 4: verification.
  input.onPhase?.("verifying");
  const verified = await runVerificationPass(raw, rules, llmContext);

  input.onPhase?.("done");
  return {
    findings: verified,
    score: calculateComplianceScore(verified),
    stats: {
      filesScanned: selected.length,
      chunks: chunks.length,
      findingsRaw: raw.length,
      findingsVerified: verified.length,
      durationMs: Date.now() - startedAt,
    },
  };
}
