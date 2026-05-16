// Server-only by transitive dependency on the Supabase admin client.
// Omitting the explicit `server-only` marker keeps this module importable
// from CLI scripts (e.g. scripts/dev-scan.mts) and from provider
// implementations that live outside the Next.js bundle in tests.
import { childLogger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// Pricing in cents per 1M tokens for models with publicly-known rates.
// Self-hosters running their own model (vLLM, llama.cpp, Ollama, …) can
// leave their model out of this table — `computeCostCents` returns 0 for
// unknown models, which is the correct answer for hardware-only spend.
//
// Numbers reflect each provider's posted list price at the time the
// entry was added. Override per-deploy by replacing this map.
const PRICING_CENTS_PER_1M: Record<
  string,
  { input: number; cached_input: number; output: number }
> = {
  // Anthropic — May 2026 list prices.
  "claude-sonnet-4-6": { input: 300, cached_input: 30, output: 1500 },
  "claude-haiku-4-5": { input: 100, cached_input: 10, output: 500 },
  // OpenAI — May 2026 list prices.
  "gpt-4.1": { input: 200, cached_input: 50, output: 800 },
  "gpt-4.1-mini": { input: 40, cached_input: 10, output: 160 },
  "gpt-4o": { input: 250, cached_input: 125, output: 1000 },
  "gpt-4o-mini": { input: 15, cached_input: 8, output: 60 },
};

// Free-form: matches whatever string the provider implementation reports.
// We don't constrain it here so OSS users can target any model name
// (openrouter slugs, custom local model ids, etc.).
export type Model = string;
export type Provider = string;
export type Pass = "recon" | "deep_scan" | "verification";

export function computeCostCents(
  model: Model,
  inputTokens: number,
  cachedTokens: number,
  outputTokens: number,
): number {
  if (inputTokens < 0 || cachedTokens < 0 || outputTokens < 0) {
    throw new Error("token counts must be non-negative");
  }
  if (cachedTokens > inputTokens) {
    throw new Error("cached_tokens cannot exceed input_tokens");
  }
  // eslint-disable-next-line security/detect-object-injection -- map key is a model id we control
  const rates = PRICING_CENTS_PER_1M[model];
  if (!rates) {
    // Unknown model: this is normal for self-hosted / local / unpublished
    // models. Record the call with cost=0 instead of throwing — token
    // counts and duration are still useful even without pricing.
    return 0;
  }

  const freshInput = inputTokens - cachedTokens;
  const totalCentsScaled =
    freshInput * rates.input + cachedTokens * rates.cached_input + outputTokens * rates.output;

  // Always round UP so a partial cent is still billed (we never want to
  // under-record a cost). For zero-rate models this stays 0.
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
