// Server-only by transitive dependency on the OpenRouter client and
// Supabase admin paths. Omitting the explicit `server-only` marker keeps
// this module importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { callOpenRouter } from "@/lib/llm/openrouter";
import { LlmJsonParseError, parseStrictJson } from "@/lib/llm/parser";
import { buildReconUserPrompt, buildSystemPrompt } from "@/lib/llm/prompts";
import type { ComplianceRule } from "@/lib/rules/types";

import type { ReconResponse } from "./findings";
import { ReconResponseSchema } from "./findings";
import type { ScannerFile } from "./types";

const MAX_RECON_PATHS = 15;

export type ReconResult = {
  readonly topPaths: readonly string[];
  readonly raw: ReconResponse;
};

export type ReconOptions = {
  readonly scanId?: string | null;
  readonly userId?: string | null;
};

export async function runReconPass(
  files: readonly ScannerFile[],
  rules: readonly ComplianceRule[],
  options: ReconOptions = {},
): Promise<ReconResult> {
  if (files.length === 0) {
    return { topPaths: [], raw: { top_paths: [] } };
  }
  const inputPaths = new Set(files.map((f) => f.path));
  const systemPrompt = buildSystemPrompt(rules);
  const userPrompt = buildReconUserPrompt(
    files.map((f) => ({ path: f.path, content: f.content ?? "" })),
  );

  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const first = await callOpenRouter(messages, {
    pass: "recon",
    scanId: options.scanId ?? null,
    userId: options.userId ?? null,
  });

  let parsed: ReconResponse;
  try {
    parsed = parseStrictJson<ReconResponse>(first.text, ReconResponseSchema);
  } catch (err) {
    if (!(err instanceof LlmJsonParseError)) throw err;
    const second = await callOpenRouter(
      [...messages, { role: "user" as const, content: retryUserPrompt(err) }],
      {
        pass: "recon",
        scanId: options.scanId ?? null,
        userId: options.userId ?? null,
      },
    );
    parsed = parseStrictJson<ReconResponse>(second.text, ReconResponseSchema);
  }

  const filtered: string[] = [];
  for (const path of parsed.top_paths) {
    if (filtered.length >= MAX_RECON_PATHS) break;
    if (!inputPaths.has(path)) continue;
    if (filtered.includes(path)) continue;
    filtered.push(path);
  }

  return { topPaths: filtered, raw: parsed };
}

function retryUserPrompt(err: LlmJsonParseError): string {
  const issues = err.zodIssues.length
    ? err.zodIssues.map((i) => `- ${i.path.join(".") || "<root>"}: ${i.message}`).join("\n")
    : err.message;
  return [
    "Your previous response was not valid JSON for the recon schema.",
    `Errors:\n${issues}`,
    'Re-emit ONLY the JSON object {"top_paths": ["path1", ...]}.',
  ].join("\n");
}
