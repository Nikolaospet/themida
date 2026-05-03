// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GDPR_001 } from "@/lib/rules/gdpr";

import { runReconPass } from "./recon";

const callOpenRouterMock = vi.fn();
vi.mock("@/lib/llm/openrouter", () => ({
  callOpenRouter: (...args: unknown[]) => callOpenRouterMock(...args),
}));

beforeEach(() => {
  callOpenRouterMock.mockReset();
});

describe("runReconPass", () => {
  it("returns the model's ordered top paths, filtered to the input set", async () => {
    callOpenRouterMock.mockResolvedValue({
      text: JSON.stringify({ top_paths: ["src/auth.ts", "src/hallucinated.ts", "README.md"] }),
      inputTokens: 100,
      outputTokens: 20,
      durationMs: 50,
      requestId: "r-1",
      model: "google/gemma-4-31b-it:free",
      provider: "openrouter",
    });

    const result = await runReconPass(
      [
        { path: "README.md", size: 10, content: "# hi" },
        { path: "src/auth.ts", size: 50, content: "export function login() {}" },
        { path: "src/utils.ts", size: 20, content: "export const x = 1" },
      ],
      [GDPR_001],
    );

    expect(result.topPaths).toEqual(["src/auth.ts", "README.md"]);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(1);
  });

  it("retries once when the response is unparseable, then succeeds", async () => {
    callOpenRouterMock
      .mockResolvedValueOnce({
        text: "not json at all",
        inputTokens: 50,
        outputTokens: 5,
        durationMs: 30,
        requestId: "r-1",
        model: "google/gemma-4-31b-it:free",
        provider: "openrouter",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ top_paths: ["a.ts"] }),
        inputTokens: 50,
        outputTokens: 5,
        durationMs: 30,
        requestId: "r-2",
        model: "google/gemma-4-31b-it:free",
        provider: "openrouter",
      });

    const result = await runReconPass([{ path: "a.ts", size: 1, content: "x" }], [GDPR_001]);
    expect(result.topPaths).toEqual(["a.ts"]);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(2);
  });

  it("propagates the parse error after a second failure", async () => {
    callOpenRouterMock.mockResolvedValue({
      text: "garbage",
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 0,
      requestId: "r",
      model: "google/gemma-4-31b-it:free",
      provider: "openrouter",
    });

    await expect(
      runReconPass([{ path: "a.ts", size: 1, content: "x" }], [GDPR_001]),
    ).rejects.toThrow(/JSON/u);
  });

  it("returns an empty list when given no files", async () => {
    const result = await runReconPass([], [GDPR_001]);
    expect(result.topPaths).toEqual([]);
    expect(callOpenRouterMock).not.toHaveBeenCalled();
  });
});
