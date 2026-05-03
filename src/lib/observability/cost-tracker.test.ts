// @vitest-environment node
import { describe, expect, it } from "vitest";

import { computeCostCents, type Model } from "./cost-tracker";

describe("computeCostCents", () => {
  it("computes claude-sonnet-4-6 cost without cached tokens", () => {
    // 100K input @ 300c/1M + 20K output @ 1500c/1M = 30 + 30 = 60c
    const cents = computeCostCents("claude-sonnet-4-6", 100_000, 0, 20_000);
    expect(cents).toBe(60);
  });

  it("applies cached-input discount", () => {
    // 80K cached @ 30c/1M = 2.4c, 20K fresh @ 300c/1M = 6c, 20K out @ 1500c/1M = 30c
    // total = 38.4 → ceil → 39
    const cents = computeCostCents("claude-sonnet-4-6", 100_000, 80_000, 20_000);
    expect(cents).toBe(39);
  });

  it("computes claude-haiku-4-5 cost", () => {
    // 50K @ 100c/1M = 5c + 5K @ 500c/1M = 2.5c → ceil 8
    const cents = computeCostCents("claude-haiku-4-5", 50_000, 0, 5_000);
    expect(cents).toBe(8);
  });

  it("ceils a fractional cent up", () => {
    const cents = computeCostCents("claude-haiku-4-5", 1, 0, 1);
    expect(cents).toBe(1);
  });

  it("returns zero cents for the Gemma free model regardless of token volume", () => {
    expect(computeCostCents("google/gemma-4-31b-it:free", 0, 0, 0)).toBe(0);
    expect(computeCostCents("google/gemma-4-31b-it:free", 1_000_000, 0, 1_000_000)).toBe(0);
  });

  it("rejects negative token counts", () => {
    expect(() => computeCostCents("claude-sonnet-4-6", -1, 0, 0)).toThrow(/non-negative/);
    expect(() => computeCostCents("claude-sonnet-4-6", 0, -1, 0)).toThrow(/non-negative/);
    expect(() => computeCostCents("claude-sonnet-4-6", 0, 0, -1)).toThrow(/non-negative/);
  });

  it("rejects cached_tokens > input_tokens", () => {
    expect(() => computeCostCents("claude-sonnet-4-6", 100, 200, 0)).toThrow(
      /cached_tokens cannot exceed input_tokens/,
    );
  });

  it("rejects unknown models", () => {
    expect(() => computeCostCents("claude-future-99" as unknown as Model, 100, 0, 100)).toThrow(
      /unknown model/,
    );
  });
});
