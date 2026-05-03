// Server-only by transitive dependency on the Supabase admin client.
// Omitting the explicit `server-only` marker keeps this module importable
// from CLI scripts (e.g. scripts/dev-scan.mts) and from the Anthropic
// client which lives outside the Next.js bundle in tests.
import { childLogger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Pricing in cents per 1M tokens. Anthropic public rates as of May 2026.
const PRICING_CENTS_PER_1M = {
  "claude-sonnet-4-6": { input: 300, cached_input: 30, output: 1500 },
  "claude-haiku-4-5": { input: 100, cached_input: 10, output: 500 },
} as const;

export type Model = keyof typeof PRICING_CENTS_PER_1M;
export type Provider = "openrouter" | "anthropic";
export type Pass = "recon" | "deep_scan" | "verification";

export function computeCostCents(
  model: Model,
  inputTokens: number,
  cachedTokens: number,
  outputTokens: number,
): number {
  // eslint-disable-next-line security/detect-object-injection -- model is a keyof typeof PRICING_CENTS_PER_1M
  const rates = PRICING_CENTS_PER_1M[model];
  if (!rates) {
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
  // under-record a cost). For the free model this stays 0.
  return Math.ceil(totalCentsScaled / 1_000_000);
}

type RecordArgs = {
  scanId: string | null;
  userId: string | null;
  provider: Provider;
  model: Model;
  pass: Pass;
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  durationMs: number | null;
  requestId: string | null;
};

const log = childLogger({ component: "cost-tracker" });

/**
 * Records a single LLM call to `llm_api_calls`. Cost-tracking failures
 * are logged but never thrown — a downstream scan must keep going even
 * if observability misbehaves.
 */
export async function recordLlmCall(args: RecordArgs): Promise<{ costCents: number }> {
  const costCents = computeCostCents(
    args.model,
    args.inputTokens,
    args.cachedTokens,
    args.outputTokens,
  );

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("llm_api_calls").insert({
    scan_id: args.scanId,
    user_id: args.userId,
    provider: args.provider,
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
      {
        err: error,
        scanId: args.scanId,
        provider: args.provider,
        model: args.model,
        pass: args.pass,
      },
      "failed to record LLM API call",
    );
  }

  return { costCents };
}
