// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type * as CostTracker from "@/lib/observability/cost-tracker";

import { LlmContractError, LlmRateLimitError, LlmServerError } from "../types";
import { callOpenAI } from "./openai";

const recordLlmCallMock = vi.fn();
vi.mock("@/lib/observability/cost-tracker", async () => {
  const actual = await vi.importActual<typeof CostTracker>("@/lib/observability/cost-tracker");
  return {
    ...actual,
    recordLlmCall: (...args: unknown[]) => recordLlmCallMock(...args),
  };
});

vi.mock("@/env", () => ({
  serverEnv: {
    OPENAI_API_KEY: "test-key",
    OPENAI_BASE_URL: "https://api.openai.com/v1",
    OPENAI_MODEL: "gpt-4.1-mini",
    OPENAI_REQUEST_ID_HEADER: "x-request-id",
    OPENAI_PROVIDER_LABEL: "openai",
  },
}));

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", "x-request-id": "req_xyz" },
    ...init,
  });
}

function happyPayload() {
  return {
    id: "chatcmpl_123",
    model: "gpt-4.1-mini",
    choices: [{ message: { role: "assistant", content: "hello back" } }],
    usage: { prompt_tokens: 12, completion_tokens: 7 },
  };
}

describe("callOpenAI", () => {
  beforeEach(() => {
    recordLlmCallMock.mockReset();
    recordLlmCallMock.mockResolvedValue({ costCents: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns assistant content and records the call", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(happyPayload()));
    const result = await callOpenAI([{ role: "user", content: "ping" }], { pass: "recon" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.text).toBe("hello back");
    expect(result.inputTokens).toBe(12);
    expect(result.outputTokens).toBe(7);
    expect(result.provider).toBe("openai");
    expect(recordLlmCallMock).toHaveBeenCalledTimes(1);
    const recordedCall = recordLlmCallMock.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(recordedCall).toMatchObject({
      provider: "openai",
      model: "gpt-4.1-mini",
      pass: "recon",
      inputTokens: 12,
      outputTokens: 7,
    });
  });

  it("hoists cached prompt tokens from prompt_tokens_details", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        ...happyPayload(),
        usage: {
          prompt_tokens: 100,
          completion_tokens: 20,
          prompt_tokens_details: { cached_tokens: 60 },
        },
      }),
    );
    await callOpenAI([{ role: "user", content: "x" }], { pass: "deep_scan" });
    const recordedCall = recordLlmCallMock.mock.calls[0]?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(recordedCall).toMatchObject({
      inputTokens: 100,
      cachedTokens: 60,
      outputTokens: 20,
    });
  });

  it("retries on 429 then succeeds", async () => {
    vi.useFakeTimers();
    try {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(
          new Response("rate limited", {
            status: 429,
            headers: { "retry-after": "0", "x-request-id": "req_429" },
          }),
        )
        .mockResolvedValueOnce(jsonResponse(happyPayload()));
      const pending = callOpenAI([{ role: "user", content: "x" }], { pass: "recon" });
      await vi.runAllTimersAsync();
      const result = await pending;
      expect(result.text).toBe("hello back");
      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(recordLlmCallMock).toHaveBeenCalledTimes(2); // one failure row + one success row
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws LlmRateLimitError when 429s exhaust", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "0", "x-request-id": "req_429" },
        }),
      );
      const settled = callOpenAI([{ role: "user", content: "x" }], { pass: "recon" }).then(
        (value) => ({ ok: true as const, value }),
        (err: unknown) => ({ ok: false as const, err }),
      );
      await vi.runAllTimersAsync();
      const outcome = await settled;
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.err).toBeInstanceOf(LlmRateLimitError);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws LlmServerError on 500 after exhausting attempts", async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        new Response("boom", { status: 500, headers: { "x-request-id": "req_500" } }),
      );
      const settled = callOpenAI([{ role: "user", content: "x" }], { pass: "recon" }).then(
        (value) => ({ ok: true as const, value }),
        (err: unknown) => ({ ok: false as const, err }),
      );
      await vi.runAllTimersAsync();
      const outcome = await settled;
      expect(outcome.ok).toBe(false);
      if (!outcome.ok) expect(outcome.err).toBeInstanceOf(LlmServerError);
    } finally {
      vi.useRealTimers();
    }
  });

  it("throws LlmServerError on a 4xx with no retry", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("bad request", { status: 400, headers: { "x-request-id": "req_400" } }),
    );
    await expect(
      callOpenAI([{ role: "user", content: "x" }], { pass: "recon" }),
    ).rejects.toBeInstanceOf(LlmServerError);
  });

  it("throws LlmContractError when usage is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      jsonResponse({
        id: "chatcmpl_no_usage",
        model: "gpt-4.1-mini",
        choices: [{ message: { content: "hi" } }],
      }),
    );
    await expect(
      callOpenAI([{ role: "user", content: "x" }], { pass: "recon" }),
    ).rejects.toBeInstanceOf(LlmContractError);
  });
});
