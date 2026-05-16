// Server-only by transitive dependency on the LLM provider and
// Supabase admin paths. Omitting the explicit `server-only` marker keeps
// this module importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { callLlm } from "@/lib/llm";
import { LlmJsonParseError, parseStrictJson } from "@/lib/llm/parser";
import { buildDeepScanUserPrompt, buildSystemPrompt } from "@/lib/llm/prompts";
import type { ComplianceRule } from "@/lib/rules/types";

import type { DeepScanResponse, RawFinding } from "./findings";
import { DeepScanResponseSchema } from "./findings";
import type { ScannerFile } from "./types";

const DEFAULT_CONCURRENCY = 2;

export type DeepScanOptions = {
  readonly scanId?: string | null;
  readonly userId?: string | null;
  readonly concurrency?: number;
  readonly onChunkComplete?: (done: number, total: number) => void;
};

export async function runDeepScanPass(
  chunks: readonly (readonly ScannerFile[])[],
  rules: readonly ComplianceRule[],
  options: DeepScanOptions = {},
): Promise<RawFinding[]> {
  if (chunks.length === 0) return [];

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const systemPrompt = buildSystemPrompt(rules);
  const findings: RawFinding[] = [];

  for (let start = 0; start < chunks.length; start += concurrency) {
    const slice = chunks.slice(start, start + concurrency);
    const results = await Promise.all(
      slice.map((chunk) => scanChunk(chunk, systemPrompt, options)),
    );
    for (const r of results) {
      findings.push(...r);
    }
    options.onChunkComplete?.(Math.min(start + slice.length, chunks.length), chunks.length);
  }

  return findings;
}

async function scanChunk(
  chunk: readonly ScannerFile[],
  systemPrompt: string,
  options: DeepScanOptions,
): Promise<RawFinding[]> {
  const userPrompt = buildDeepScanUserPrompt(
    chunk.map((f) => ({ path: f.path, content: f.content ?? "" })),
  );
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const first = await callLlm(messages, {
    pass: "deep_scan",
    scanId: options.scanId ?? null,
    userId: options.userId ?? null,
  });

  let parsed: DeepScanResponse;
  try {
    parsed = parseStrictJson<DeepScanResponse>(first.text, DeepScanResponseSchema);
  } catch (err) {
    if (!(err instanceof LlmJsonParseError)) throw err;
    const second = await callLlm(
      [...messages, { role: "user" as const, content: retryUserPrompt(err) }],
      { pass: "deep_scan", scanId: options.scanId ?? null, userId: options.userId ?? null },
    );
    parsed = parseStrictJson<DeepScanResponse>(second.text, DeepScanResponseSchema);
  }

  return parsed.issues;
}

function retryUserPrompt(err: LlmJsonParseError): string {
  const issues = err.zodIssues.length
    ? err.zodIssues.map((i) => `- ${i.path.join(".") || "<root>"}: ${i.message}`).join("\n")
    : err.message;
  return [
    "Your previous response was not valid JSON for the deep-scan schema.",
    `Errors:\n${issues}`,
    "Re-emit ONLY the JSON object with the issues + summary fields.",
  ].join("\n");
}
