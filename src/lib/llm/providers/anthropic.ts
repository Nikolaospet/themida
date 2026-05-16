// Server-only by transitive dependency on serverEnv and the Supabase admin
// client. Omitting the explicit `server-only` marker keeps this module
// importable from CLI scripts (e.g. scripts/dev-scan.mts).
import { serverEnv } from "@/env";
import { childLogger } from "@/lib/logger";
import { type Model, recordLlmCall } from "@/lib/observability/cost-tracker";

import type { LlmCallOptions, LlmCallResult, LlmMessage } from "../types";
import { LlmContractError, LlmRateLimitError, LlmServerError } from "../types";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 1_000;

const log = childLogger({ component: "anthropic" });

/**
 * Calls the Anthropic Messages API.
 *
 * Differences from OpenAI-style chat completions:
 * - System messages collapse into a top-level `system` field (string).
 * - Response shape: `content[0].text` and `usage.input_tokens` / `usage.output_tokens`.
 * - Headers: `x-api-key` + `anthropic-version`, no Bearer token.
 */
export async function callAnthropic(
  messages: readonly LlmMessage[],
  options: LlmCallOptions,
): Promise<LlmCallResult> {
  const model = serverEnv.ANTHROPIC_MODEL as Model;
  const { system, userMessages } = splitSystemAndMessages(messages);
  const body = JSON.stringify({
    model,
    system,
    messages: userMessages,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 4096,
  });

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    const startedAt = Date.now();
    try {
      const response = await globalThis.fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "x-api-key": serverEnv.ANTHROPIC_API_KEY,
          "anthropic-version": ANTHROPIC_VERSION,
          "content-type": "application/json",
        },
        body,
        signal: options.abortSignal ?? null,
      });
      const durationMs = Date.now() - startedAt;
      const requestId = response.headers.get("request-id") ?? "";

      if (response.status === 429) {
        const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
        await recordFailure({ options, model, durationMs, requestId, status: 429 });
        lastError = new LlmRateLimitError(
          `Anthropic rate-limited (attempt ${attempt}/${MAX_ATTEMPTS})`,
          retryAfterMs,
        );
        if (attempt === MAX_ATTEMPTS) throw lastError;
        await sleepWithBackoff(attempt, retryAfterMs);
        continue;
      }

      if (response.status >= 500) {
        await recordFailure({ options, model, durationMs, requestId, status: response.status });
        lastError = new LlmServerError(
          `Anthropic ${response.status} (attempt ${attempt}/${MAX_ATTEMPTS})`,
          response.status,
        );
        if (attempt === MAX_ATTEMPTS) throw lastError;
        await sleepWithBackoff(attempt, null);
        continue;
      }

      if (!response.ok) {
        await recordFailure({ options, model, durationMs, requestId, status: response.status });
        const text = await response.text();
        throw new LlmServerError(
          `Anthropic ${response.status}: ${text.slice(0, 200)}`,
          response.status,
        );
      }

      const payload = (await response.json()) as {
        id?: string;
        model?: string;
        content?: Array<{ type?: string; text?: string }>;
        usage?: {
          input_tokens?: number;
          output_tokens?: number;
          cache_read_input_tokens?: number;
        };
      };

      const text = firstTextBlock(payload.content);
      const inputTokens = payload.usage?.input_tokens;
      const outputTokens = payload.usage?.output_tokens;
      const cachedTokens = payload.usage?.cache_read_input_tokens ?? 0;
      const responseModel = payload.model ?? model;
      const responseId = payload.id ?? requestId;

      if (
        typeof text !== "string" ||
        typeof inputTokens !== "number" ||
        typeof outputTokens !== "number"
      ) {
        await recordFailure({ options, model, durationMs, requestId: responseId, status: 200 });
        throw new LlmContractError(
          `Anthropic response missing text/usage (model=${responseModel}, id=${responseId})`,
        );
      }

      await recordLlmCall({
        scanId: options.scanId ?? null,
        userId: options.userId ?? null,
        provider: "anthropic",
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
        provider: "anthropic",
      };
    } catch (err) {
      if (
        err instanceof LlmRateLimitError ||
        err instanceof LlmServerError ||
        err instanceof LlmContractError
      ) {
        throw err;
      }
      log.warn({ err, attempt }, "anthropic network failure");
      lastError = err;
      if (attempt === MAX_ATTEMPTS) throw err;
      await sleepWithBackoff(attempt, null);
    }
  }

  throw lastError ?? new Error("callAnthropic: exhausted attempts without throwing");
}

function splitSystemAndMessages(messages: readonly LlmMessage[]): {
  system: string;
  userMessages: Array<{ role: "user" | "assistant"; content: string }>;
} {
  const systemParts: string[] = [];
  const userMessages: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) {
    if (m.role === "system") {
      systemParts.push(m.content);
    } else {
      userMessages.push({ role: "user", content: m.content });
    }
  }
  return { system: systemParts.join("\n\n"), userMessages };
}

function firstTextBlock(
  content: Array<{ type?: string; text?: string }> | undefined,
): string | undefined {
  if (!content) return undefined;
  for (const block of content) {
    if (block.type === "text" && typeof block.text === "string") return block.text;
  }
  return undefined;
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
    "anthropic call failed; recording zero-token row",
  );
  await recordLlmCall({
    scanId: args.options.scanId ?? null,
    userId: args.options.userId ?? null,
    provider: "anthropic",
    model: args.model,
    pass: args.options.pass,
    inputTokens: 0,
    cachedTokens: 0,
    outputTokens: 0,
    durationMs: args.durationMs,
    requestId: args.requestId || null,
  });
}
