// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { callAnthropic } from "./anthropic";
import { LlmContractError, LlmRateLimitError, LlmServerError } from "./types";

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
    ANTHROPIC_API_KEY: "key-test",
    ANTHROPIC_MODEL: "claude-sonnet-4-6",
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
    headers: new Headers({ "request-id": requestId }),
    json: async () => ({
      id: requestId,
      model: "claude-sonnet-4-6",
      content: [{ type: "text", text: content }],
      usage: { input_tokens: 1234, output_tokens: 56 },
    }),
    text: async () => "",
  } as unknown as Response;
}

describe("callAnthropic", () => {
  it("returns text + token usage on success", async () => {
    fetchMock.mockResolvedValueOnce(okResponse('{"top_paths":["a.ts"]}'));

    const result = await callAnthropic(
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
    expect(result.provider).toBe("anthropic");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(recordLlmCallMock).toHaveBeenCalledTimes(1);
    expect(recordLlmCallMock).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "anthropic",
        pass: "recon",
        inputTokens: 1234,
        outputTokens: 56,
      }),
    );
  });

  it("sends x-api-key + anthropic-version headers", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("{}"));
    await callAnthropic([{ role: "user", content: "x" }], { pass: "deep_scan" });

    const call = fetchMock.mock.calls[0]!;
    const init = call[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("x-api-key")).toBe("key-test");
    expect(headers.get("anthropic-version")).toBe("2023-06-01");
    expect(headers.get("content-type")).toBe("application/json");
  });

  it("collapses system messages into the top-level system field", async () => {
    fetchMock.mockResolvedValueOnce(okResponse("{}"));
    await callAnthropic(
      [
        { role: "system", content: "you are a compliance engineer" },
        { role: "user", content: "scan this" },
      ],
      { pass: "deep_scan" },
    );

    const call = fetchMock.mock.calls[0]!;
    const body = JSON.parse((call[1] as RequestInit).body as string);
    expect(body.system).toBe("you are a compliance engineer");
    expect(body.messages).toEqual([{ role: "user", content: "scan this" }]);
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

    const settled = callAnthropic([{ role: "user", content: "x" }], { pass: "recon" })
      .then((r) => ({ ok: true as const, value: r }))
      .catch((err: unknown) => ({ ok: false as const, err }));

    await vi.runAllTimersAsync();
    const result = await settled;

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.requestId).toBe("req-2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(recordLlmCallMock).toHaveBeenCalledTimes(2);
  });

  it("surfaces LlmRateLimitError after exhausting retries", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "retry-after": "2" }),
      json: async () => ({}),
      text: async () => "rate limited",
    } as unknown as Response);

    const settled = callAnthropic([{ role: "user", content: "x" }], { pass: "recon" })
      .then((r) => ({ ok: true as const, value: r }))
      .catch((err: unknown) => ({ ok: false as const, err }));

    await vi.runAllTimersAsync();
    const result = await settled;

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.err).toBeInstanceOf(LlmRateLimitError);
    expect(fetchMock).toHaveBeenCalledTimes(3);
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

    const settled = callAnthropic([{ role: "user", content: "x" }], { pass: "recon" })
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
      callAnthropic([{ role: "user", content: "x" }], { pass: "recon" }),
    ).rejects.toBeInstanceOf(LlmServerError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws LlmContractError when the response shape is wrong", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      json: async () => ({ id: "x", model: "m", content: [], usage: {} }),
      text: async () => "",
    } as unknown as Response);

    await expect(
      callAnthropic([{ role: "user", content: "x" }], { pass: "recon" }),
    ).rejects.toBeInstanceOf(LlmContractError);
  });
});
