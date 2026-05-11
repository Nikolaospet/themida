import { z } from "zod";

const PHASES = [
  "queued",
  "fetching",
  "filtering",
  "recon",
  "deep_scan",
  "verifying",
  "done",
] as const;

export type ScanPhase = (typeof PHASES)[number];

export type ScanProgress =
  | { phase: Exclude<ScanPhase, "deep_scan"> }
  | { phase: "deep_scan"; filesDone: number; filesTotal: number };

const RawSchema = z
  .object({
    phase: z.string().optional(),
    files_done: z.number().int().nonnegative().optional(),
    files_total: z.number().int().nonnegative().optional(),
  })
  .passthrough();

export function parseProgress(raw: unknown): ScanProgress {
  const parsed = RawSchema.parse(raw ?? {});
  const phase = parsed.phase ?? "queued";
  if (!PHASES.includes(phase as ScanPhase)) {
    throw new Error(`invalid phase: ${phase}`);
  }
  if (phase === "deep_scan") {
    return {
      phase,
      filesDone: parsed.files_done ?? 0,
      filesTotal: parsed.files_total ?? 0,
    };
  }
  return { phase: phase as Exclude<ScanPhase, "deep_scan"> };
}

export function serializeProgress(p: ScanProgress): Record<string, unknown> {
  if (p.phase === "deep_scan") {
    return { phase: p.phase, files_done: p.filesDone, files_total: p.filesTotal };
  }
  return { phase: p.phase };
}
