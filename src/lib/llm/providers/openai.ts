// Server-only by transitive dependency on serverEnv and the Supabase admin
// client. Omitting the explicit `server-only` marker keeps this module
// importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { serverEnv } from "@/env";
import { childLogger } from "@/lib/logger";
import { recordLlmCall } from "@/lib/observability/cost-tracker";

import type { LlmCallOptions, LlmCallResult, LlmMessage } from "../types";
import { LlmContractError, LlmRateLimitError, LlmServerError } from "../types";

const DEFAULT_BASE_URL = "https://api.openai.com/v1";
const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

const log = childLogger({ component: "openai" });

/**
 * Calls any OpenAI Chat-Completions-compatible endpoint:
 *
 * - OpenAI (`https://api.openai.com/v1`, default)
 * - OpenRouter (`https://openrouter.ai/api/v1`)
 * - Groq (`https://api.groq.com/openai/v1`)
 * - Together (`https://api.together.xyz/v1`)
 * - vLLM, llama.cpp server, Ollama, LiteLLM, any local proxy
 *
 * Configure with `OPENAI_BASE_URL` + `OPENAI_API_KEY` + `OPENAI_MODEL`.
 * For providers with a different request-id header, override
 * `OPENAI_REQUEST_ID_HEADER` (defaults to `x-request-id`).
 */
export async function callOpenAI(
  messages: readonly LlmMessage[],
  options: LlmCallOptions,
): Promise<LlmCallResult> {
  const baseUrl = (serverEnv.OPENAI_BASE_URL ?? DEFAULT_BASE_URL).replace(/\/+$/u, "");
  const endpoint = `${baseUrl}/chat/completions`;
  const apiKey = serverEnv.OPENAI_API_KEY;
  const model = serverEnv.OPENAI_MODEL ?? DEFAULT_MODEL;
  const requestIdHeader = serverEnv.OPENAI_REQUEST_ID_HEADER ?? "x-request-id";
  const providerName = serverEnv.OPENAI_PROVIDER_LABEL ?? "openai";

  const body = JSON.stringify({
    model,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 4096,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await globalThis.fetch(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body,
        signal: options.abortSignal ?? null,
      });
      const durationMs = Date.now() - startedAt;
      const requestId = response.headers.get(requestIdHeader) ?? "";

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
        await recordFailure({
          options,
          provider: providerName,
          model,
          durationMs,
          requestId,
          status: 429,
        });
        lastError = new LlmRateLimitError(
          `OpenAI-compatible provider rate-limited (attempt ${attempt}/${MAX_ATTEMPTS})`,
          retryAfterMs,
        );
        if (attempt === MAX_ATTEMPTS) throw lastError;
        await sleepWithBackoff(attempt, retryAfterMs);
        continue;
      }

      if (response.status >= 500) {
        await recordFailure({
          options,
          provider: providerName,
          model,
          durationMs,
          requestId,
          status: response.status,
        });
        lastError = new LlmServerError(
          `OpenAI-compatible provider ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS})`,
          response.status,
        );
        if (attempt === MAX_ATTEMPTS) throw lastError;
        await sleepWithBackoff(attempt, null);
        continue;
      }

      if (!response.ok) {
        await recordFailure({
          options,
          provider: providerName,
          model,
          durationMs,
          requestId,
          status: response.status,
        });
        const text = await response.text();
        throw new LlmServerError(
          `OpenAI-compatible provider ${response.status}: ${text.slice(0, 200)}`,
          response.status,
        );
      }

      const payload = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { role?: string; content?: string } }>;
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          // Some providers (OpenAI, vLLM with --enable-prompt-tokens-details)
          // return cached prompt-token counts under either spelling.
          cached_tokens?: number;
          prompt_tokens_details?: { cached_tokens?: number };
        };
      };

      const text = payload.choices?.[0]?.message?.content;
      const inputTokens = payload.usage?.prompt_tokens;
      const outputTokens = payload.usage?.completion_tokens;
      const cachedTokens =
        payload.usage?.prompt_tokens_details?.cached_tokens ?? payload.usage?.cached_tokens ?? 0;
      const responseModel = payload.model ?? model;
      const responseId = payload.id ?? requestId;

      if (
        typeof text !== "string" ||
        typeof inputTokens !== "number" ||
        typeof outputTokens !== "number"
      ) {
        await recordFailure({
          options,
          provider: providerName,
          model,
          durationMs,
          requestId: responseId,
          status: 200,
        });
        throw new LlmContractError(
          `OpenAI-compatible response missing content/usage (model=${responseModel}, id=${responseId})`,
        );
      }

      await recordLlmCall({
        scanId: options.scanId ?? null,
        userId: options.userId ?? null,
        provider: providerName,
        model,
        pass: options.pass,
        inputTokens,
        cachedTokens,
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
        provider: providerName,
      };
    } catch (err) {
      if (
        err instanceof LlmRateLimitError ||
        err instanceof LlmServerError ||
        err instanceof LlmContractError
      ) {
        throw err;
      }
      log.warn({ err, attempt }, "openai-compatible network failure");
      lastError = err;
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleepWithBackoff(attempt, null);
    }
  }

  throw lastError ?? new Error("callOpenAI: exhausted attempts without throwing");
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
  provider: string;
  model: string;
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
      provider: args.provider,
    },
    "openai-compatible call failed; recording zero-token row",
  );
  await recordLlmCall({
    scanId: args.options.scanId ?? null,
    userId: args.options.userId ?? null,
    provider: args.provider,
    model: args.model,
    pass: args.options.pass,
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    durationMs: args.durationMs,
    requestId: args.requestId || null,
  });
}
