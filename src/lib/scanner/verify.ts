// Server-only by transitive dependency on the Anthropic client and
// Supabase admin paths. Omitting the explicit `server-only` marker keeps
// this module importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { callAnthropic } from "@/lib/llm/anthropic";
import { LlmJsonParseError, parseStrictJson } from "@/lib/llm/parser";
import { buildSystemPrompt, buildVerificationUserPrompt } from "@/lib/llm/prompts";
import type { ComplianceRule } from "@/lib/rules/types";

import type { RawFinding, VerificationResponse } from "./findings";
import { VerificationResponseSchema } from "./findings";

const BATCH_SIZE = 30;

export type VerificationOptions = {
  readonly scanId?: string | null;
  readonly userId?: string | null;
};

export async function runVerificationPass(
  findings: readonly RawFinding[],
  rules: readonly ComplianceRule[],
  options: VerificationOptions = {},
): Promise<RawFinding[]> {
  if (findings.length === 0) return [];

  const systemPrompt = buildSystemPrompt(rules);
  const verified: RawFinding[] = [];

  for (let start = 0; start < findings.length; start += BATCH_SIZE) {
    const batch = findings.slice(start, start + BATCH_SIZE);
    const result = await verifyBatch(batch, systemPrompt, options);
    verified.push(...result.verified);
  }

  return verified;
}

async function verifyBatch(
  batch: readonly RawFinding[],
  systemPrompt: string,
  options: VerificationOptions,
): Promise<VerificationResponse> {
  const userPrompt = buildVerificationUserPrompt(batch);
  const messages = [
    { role: "system" as const, content: systemPrompt },
    { role: "user" as const, content: userPrompt },
  ];

  const first = await callAnthropic(messages, {
    pass: "verification",
    scanId: options.scanId ?? null,
    userId: options.userId ?? null,
  });

  try {
    return parseStrictJson<VerificationResponse>(first.text, VerificationResponseSchema);
  } catch (err) {
    if (!(err instanceof LlmJsonParseError)) throw err;
    const second = await callAnthropic(
      [...messages, { role: "user" as const, content: retryUserPrompt(err) }],
      { pass: "verification", scanId: options.scanId ?? null, userId: options.userId ?? null },
    );
    return parseStrictJson<VerificationResponse>(second.text, VerificationResponseSchema);
  }
}

function retryUserPrompt(err: LlmJsonParseError): string {
  const issues = err.zodIssues.length
    ? err.zodIssues.map((i) => `- ${i.path.join(".") || "<root>"}: ${i.message}`).join("\n")
    : err.message;
  return [
    "Your previous response was not valid JSON for the verification schema.",
    `Errors:\n${issues}`,
    'Re-emit ONLY {"verified": [...], "dropped": [...]}.',
  ].join("\n");
}
