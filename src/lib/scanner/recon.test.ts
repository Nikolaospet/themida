// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GDPR_001 } from "@/lib/rules/gdpr";

import { runReconPass } from "./recon";

const callLlmMock = vi.fn();
vi.mock("@/lib/llm", () => ({
  callLlm: (...args: unknown[]) => callLlmMock(...args),
}));

beforeEach(() => {
  callLlmMock.mockReset();
});

describe("runReconPass", () => {
  it("returns the model's ordered top paths, filtered to the input set", async () => {
    callLlmMock.mockResolvedValue({
      text: JSON.stringify({ top_paths: ["src/auth.ts", "src/hallucinated.ts", "README.md"] }),
      inputTokens: 100,
      outputTokens: 20,
      durationMs: 50,
      requestId: "r-1",
      model: "claude-sonnet-4-6",
      provider: "anthropic",
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
    expect(callLlmMock).toHaveBeenCalledTimes(1);
  });

  it("retries once when the response is unparseable, then succeeds", async () => {
    callLlmMock
      .mockResolvedValueOnce({
        text: "not json at all",
        inputTokens: 50,
        outputTokens: 5,
        durationMs: 30,
        requestId: "r-1",
        model: "claude-sonnet-4-6",
        provider: "anthropic",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ top_paths: ["a.ts"] }),
        inputTokens: 50,
        outputTokens: 5,
        durationMs: 30,
        requestId: "r-2",
        model: "claude-sonnet-4-6",
        provider: "anthropic",
      });

    const result = await runReconPass([{ path: "a.ts", size: 1, content: "x" }], [GDPR_001]);
    expect(result.topPaths).toEqual(["a.ts"]);
    expect(callLlmMock).toHaveBeenCalledTimes(2);
  });

  it("propagates the parse error after a second failure", async () => {
    callLlmMock.mockResolvedValue({
      text: "garbage",
      inputTokens: 0,
      outputTokens: 0,
      durationMs: 0,
      requestId: "r",
      model: "claude-sonnet-4-6",
      provider: "anthropic",
    });

    await expect(
      runReconPass([{ path: "a.ts", size: 1, content: "x" }], [GDPR_001]),
    ).rejects.toThrow(/JSON/u);
  });

  it("returns an empty list when given no files", async () => {
    const result = await runReconPass([], [GDPR_001]);
    expect(result.topPaths).toEqual([]);
    expect(callLlmMock).not.toHaveBeenCalled();
  });
});
