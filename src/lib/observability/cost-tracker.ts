import "server-only";

import { childLogger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Pricing in cents per 1M tokens (Anthropic public rates as of May 2026).
// Integer-only arithmetic avoids floating-point rounding traps in cost
// calculation. Multiply token counts by these rates, divide by 1M, and
// ceil — the result is always a whole number of cents.
const PRICING_CENTS_PER_1M = {
  "claude-sonnet-4-6": { input: 300, cached_input: 30, output: 1500 },
  "claude-haiku-4-5": { input: 100, cached_input: 10, output: 500 },
} as const;

export type Model = keyof typeof PRICING_CENTS_PER_1M;
export type Pass = "recon" | "deep_scan" | "verification";

export function computeCostCents(
  model: Model,
  inputTokens: number,
  cachedTokens: number,
  outputTokens: number,
): number {
  let rates: { input: number; cached_input: number; output: number };
  switch (model) {
    case "claude-sonnet-4-6":
      rates = PRICING_CENTS_PER_1M["claude-sonnet-4-6"];
      break;
    case "claude-haiku-4-5":
      rates = PRICING_CENTS_PER_1M["claude-haiku-4-5"];
      break;
    default:
      throw new Error(`unknown model: ${String(model)}`);
  }
  if (inputTokens < 0 || cachedTokens < 0 || outputTokens < 0) {
    throw new Error("token counts must be non-negative");
  }
  if (cachedTokens > inputTokens) {
    throw new Error("cached_tokens cannot exceed input_tokens");
  }

  const freshInput = inputTokens - cachedTokens;
  const totalCentsScaled =
    freshInput * rates.input + cachedTokens * rates.cached_input + outputTokens * rates.output;

  // Always round UP so a partial cent is still billed (we never want to
  // under-record a cost).
  return Math.ceil(totalCentsScaled / 1_000_000);
}

type RecordArgs = {
  scanId: string;
  userId: string;
  model: Model;
  pass: Pass;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  durationMs: number | null;
  requestId: string | null;
};

const log = childLogger({ component: "cost-tracker" });

export async function recordClaudeCall(args: RecordArgs): Promise<{ costCents: number }> {
  const costCents = computeCostCents(
    args.model,
    args.inputTokens,
    args.cachedTokens,
    args.outputTokens,
  );

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("claude_api_calls").insert({
    scan_id: args.scanId,
    user_id: args.userId,
    model: args.model,
    pass: args.pass,
    input_tokens: args.inputTokens,
    output_tokens: args.outputTokens,
    cached_tokens: args.cachedTokens,
    cost_cents: costCents,
    duration_ms: args.durationMs,
    request_id: args.requestId,
  });

  if (error) {
    log.error(
      { err: error, scanId: args.scanId, model: args.model, pass: args.pass },
      "failed to record Claude API call",
    );
    // Cost-tracking failure must NEVER block a scan. We log and swallow.
  }

  return { costCents };
}
