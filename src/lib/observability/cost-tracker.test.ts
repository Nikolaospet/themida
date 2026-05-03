// @vitest-environment node
import { describe, expect, it } from "vitest";

import { computeCostCents, type Model } from "./cost-tracker";

describe("computeCostCents", () => {
  // Sonnet rates: $3 / 1M input, $0.30 / 1M cached input, $15 / 1M output
  it("calculates Sonnet cost without caching", () => {
    const cents = computeCostCents("claude-sonnet-4-6", 100_000, 0, 20_000);
    // 100K * 3 / 1M = $0.30 + 20K * 15 / 1M = $0.30 → $0.60 → 60 cents
    expect(cents).toBe(60);
  });

  it("applies the cached-input discount", () => {
    const cents = computeCostCents("claude-sonnet-4-6", 100_000, 80_000, 20_000);
    // fresh = 20K * $3 / 1M = $0.06
    // cached = 80K * $0.30 / 1M = $0.024
    // output = 20K * $15 / 1M = $0.30
    // total = $0.384 → ceil to 39 cents
    expect(cents).toBe(39);
  });

  // Haiku rates: $1 / 1M input, $0.10 / 1M cached, $5 / 1M output
  it("calculates Haiku cost", () => {
    const cents = computeCostCents("claude-haiku-4-5", 50_000, 0, 5_000);
    // 50K * 1 / 1M = $0.05 + 5K * 5 / 1M = $0.025 → $0.075 → 8 cents
    expect(cents).toBe(8);
  });

  it("rounds up so partial cents never disappear", () => {
    const cents = computeCostCents("claude-haiku-4-5", 1, 0, 1);
    expect(cents).toBeGreaterThanOrEqual(1);
  });

  it("rejects negative tokens", () => {
    expect(() => computeCostCents("claude-sonnet-4-6", -1, 0, 0)).toThrow(/non-negative/);
    expect(() => computeCostCents("claude-sonnet-4-6", 0, -1, 0)).toThrow(/non-negative/);
    expect(() => computeCostCents("claude-sonnet-4-6", 0, 0, -1)).toThrow(/non-negative/);
  });

  it("rejects when cached tokens exceed input tokens", () => {
    expect(() => computeCostCents("claude-sonnet-4-6", 100, 200, 0)).toThrow(
      /cached_tokens cannot exceed input_tokens/,
    );
  });

  it("treats unknown models as an error", () => {
    expect(() => computeCostCents("claude-future-99" as unknown as Model, 100, 0, 100)).toThrow(
      /unknown model/i,
    );
  });
});
