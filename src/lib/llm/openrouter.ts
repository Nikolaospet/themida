// Server-only by transitive dependency on serverEnv and the Supabase admin
// client. Omitting the explicit `server-only` marker keeps this module
// importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { serverEnv } from "@/env";
import { childLogger } from "@/lib/logger";
import { type Model, recordLlmCall } from "@/lib/observability/cost-tracker";

import type { LlmCallOptions, LlmCallResult, LlmMessage } from "./types";
import { OpenRouterContractError, OpenRouterRateLimitError, OpenRouterServerError } from "./types";

const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

const log = childLogger({ component: "openrouter" });

export async function callOpenRouter(
  messages: readonly LlmMessage[],
  options: LlmCallOptions,
): Promise<LlmCallResult> {
  const model = serverEnv.OPENROUTER_MODEL as Model;
  const body = JSON.stringify({
    model,
    messages,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 4096,
    response_format: { type: "json_object" },
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await globalThis.fetch(ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${serverEnv.OPENROUTER_API_KEY}`,
          "content-type": "application/json",
          "x-title": "Themida",
        },
        body,
        signal: options.abortSignal ?? null,
      });
      const durationMs = Date.now() - startedAt;
      const requestId =
        response.headers.get("x-request-id") ?? response.headers.get("openrouter-request-id") ?? "";

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
        await recordFailure({
          options,
          model,
          durationMs,
          requestId,
          status: 429,
        });
        lastError = new OpenRouterRateLimitError(
          `OpenRouter rate-limited (attempt ${attempt}/${MAX_ATTEMPTS})`,
          retryAfterMs,
        );
        if (attempt === MAX_ATTEMPTS) throw lastError;
        await sleepWithBackoff(attempt, retryAfterMs);
        continue;
      }

      if (response.status >= 500) {
        await recordFailure({ options, model, durationMs, requestId, status: response.status });
        lastError = new OpenRouterServerError(
          `OpenRouter ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS})`,
          response.status,
        );
        if (attempt === MAX_ATTEMPTS) throw lastError;
        await sleepWithBackoff(attempt, null);
        continue;
      }

      if (!response.ok) {
        await recordFailure({ options, model, durationMs, requestId, status: response.status });
        const text = await response.text();
        throw new OpenRouterServerError(
          `OpenRouter ${response.status}: ${text.slice(0, 200)}`,
          response.status,
        );
      }

      const payload = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      const text = payload.choices?.[0]?.message?.content;
      const inputTokens = payload.usage?.prompt_tokens;
      const outputTokens = payload.usage?.completion_tokens;
      const responseModel = payload.model ?? model;
      const responseId = payload.id ?? requestId;

      if (
        typeof text !== "string" ||
        typeof inputTokens !== "number" ||
        typeof outputTokens !== "number"
      ) {
        await recordFailure({ options, model, durationMs, requestId: responseId, status: 200 });
        throw new OpenRouterContractError(
          `OpenRouter response missing text/usage (model=${responseModel}, id=${responseId})`,
        );
      }

      await recordLlmCall({
        scanId: options.scanId ?? null,
        userId: options.userId ?? null,
        provider: "openrouter",
        model,
        pass: options.pass,
        inputTokens,
        cachedTokens: 0,
        outputTokens,
        durationMs,
        requestId: responseId || null,
      });

      return {
        text,
        inputTokens,
        outputTokens,
        durationMs,
        requestId: responseId,
        model: responseModel,
        provider: "openrouter",
      };
    } catch (err) {
      // Already-typed errors thrown above bubble up after recordFailure.
      if (
        err instanceof OpenRouterRateLimitError ||
        err instanceof OpenRouterServerError ||
        err instanceof OpenRouterContractError
      ) {
        throw err;
      }
      // Network/abort failures: retry like a 5xx.
      log.warn({ err, attempt }, "openrouter network failure");
      lastError = err;
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleepWithBackoff(attempt, null);
    }
  }

  throw lastError ?? new Error("callOpenRouter: exhausted attempts without throwing");
}

function parseRetryAfter(value: string | null): number {
  if (!value) return BASE_BACKOFF_MS;
  const seconds = Number.parseInt(value, 10);
  if (Number.isFinite(seconds) && seconds > 0) return seconds * 1_000;
  return BASE_BACKOFF_MS;
}

async function sleepWithBackoff(attempt: number, retryAfterMs: number | null): Promise<void> {
  const baseline = retryAfterMs ?? BASE_BACKOFF_MS * 2 ** (attempt - 1);
  const jitter = Math.random() * baseline;
  await new Promise<void>((resolve) => setTimeout(resolve, baseline + jitter));
}

async function recordFailure(args: {
  options: LlmCallOptions;
  model: Model;
  durationMs: number;
  requestId: string;
  status: number;
}): Promise<void> {
  log.warn(
    {
      status: args.status,
      durationMs: args.durationMs,
      requestId: args.requestId,
      pass: args.options.pass,
    },
    "openrouter call failed; recording zero-token row",
  );
  await recordLlmCall({
    scanId: args.options.scanId ?? null,
    userId: args.options.userId ?? null,
    provider: "openrouter",
    model: args.model,
    pass: args.options.pass,
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    durationMs: args.durationMs,
    requestId: args.requestId || null,
  });
}
