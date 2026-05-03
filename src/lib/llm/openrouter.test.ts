// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callOpenRouter } from "./openrouter";
import { OpenRouterContractError, OpenRouterRateLimitError, OpenRouterServerError } from "./types";

const recordLlmCallMock = vi.fn();
vi.mock("@/lib/observability/cost-tracker", async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports -- importActual requires inline typeof import() for type inference
  const actual = await vi.importActual<typeof import("@/lib/observability/cost-tracker")>(
    "@/lib/observability/cost-tracker",
  );
  return {
    ...actual,
    recordLlmCall: (...args: unknown[]) => recordLlmCallMock(...args),
  };
});

vi.mock("@/env", () => ({
  serverEnv: {
    OPENROUTER_API_KEY: "key-test",
    OPENROUTER_MODEL: "google/gemma-4-31b-it:free",
  },
  clientEnv: {},
}));

const fetchMock = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  recordLlmCallMock.mockReset();
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
});

function okResponse(content: string, requestId = "req-1") {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ "x-request-id": requestId }),
    json: async () => ({
      id: requestId,
      model: "google/gemma-4-31b-it:free",
      choices: [{ message: { role: "assistant", content } }],
      usage: { prompt_tokens: 1234, completion_tokens: 56 },
    }),
    text: async () => "",
  } as unknown as Response;
}

describe("callOpenRouter", () => {
  it("returns text + token usage on success", async () => {
    fetchMock.mockResolvedValueOnce(okResponse('{"top_paths":["a.ts"]}'));

    const result = await callOpenRouter(
      [
        { role: "system", content: "sys" },
        { role: "user", content: "usr" },
      ],
      { pass: "recon" },
    );

    expect(result.text).toContain("top_paths");
    expect(result.inputTokens).toBe(1234);
    expect(result.outputTokens).toBe(56);
    expect(result.requestId).toBe("req-1");
    expect(result.provider).toBe("openrouter");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(recordLlmCallMock).toHaveBeenCalledTimes(1);
    expect(recordLlmCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "openrouter",
        pass: "recon",
        inputTokens: 1234,
        outputTokens: 56,
      }),
    );
  });

  it("sends the bearer token + x-title header", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("{}"));
    await callOpenRouter([{ role: "user", content: "x" }], { pass: "deep_scan" });

    const call = fetchMock.mock.calls[0]!;
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer key-test");
    expect(headers.get("content-type")).toBe("application/json");
    expect(headers.get("x-title")).toBe("Themida");
  });

  it("retries on 429 with exponential backoff", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ "retry-after": "1" }),
        json: async () => ({}),
        text: async () => "rate limited",
      } as unknown as Response)
      .mockResolvedValueOnce(okResponse("{}", "req-2"));

    const settled = callOpenRouter([{ role: "user", content: "x" }], { pass: "recon" })
      .then((r) => ({ ok: true as const, value: r }))
      .catch((err: unknown) => ({ ok: false as const, err }));

    await vi.runAllTimersAsync();
    const result = await settled;

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.requestId).toBe("req-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(recordLlmCallMock).toHaveBeenCalledTimes(2); // both attempts logged
  });

  it("surfaces OpenRouterRateLimitError after exhausting retries", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "retry-after": "2" }),
      json: async () => ({}),
      text: async () => "rate limited",
    } as unknown as Response);

    const settled = callOpenRouter([{ role: "user", content: "x" }], { pass: "recon" })
      .then((r) => ({ ok: true as const, value: r }))
      .catch((err: unknown) => ({ ok: false as const, err }));

    await vi.runAllTimersAsync();
    const result = await settled;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.err).toBeInstanceOf(OpenRouterRateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(3); // 1 initial + 2 retries
  });

  it("retries on 503 then succeeds", async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers(),
        json: async () => ({}),
        text: async () => "unavailable",
      } as unknown as Response)
      .mockResolvedValueOnce(okResponse("{}"));

    const settled = callOpenRouter([{ role: "user", content: "x" }], { pass: "recon" })
      .then((r) => ({ ok: true as const, value: r }))
      .catch((err: unknown) => ({ ok: false as const, err }));

    await vi.runAllTimersAsync();
    const result = await settled;

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.text).toBe("{}");
  });

  it("does not retry on 400-class errors other than 429", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers(),
      json: async () => ({ error: { message: "bad request" } }),
      text: async () => "bad",
    } as unknown as Response);

    await expect(
      callOpenRouter([{ role: "user", content: "x" }], { pass: "recon" }),
    ).rejects.toBeInstanceOf(OpenRouterServerError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws OpenRouterContractError when the response shape is wrong", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ id: "x", model: "m", choices: [], usage: {} }),
      text: async () => "",
    } as unknown as Response);

    await expect(
      callOpenRouter([{ role: "user", content: "x" }], { pass: "recon" }),
    ).rejects.toBeInstanceOf(OpenRouterContractError);
  });
});
