import { describe, expect, it } from "vitest";

import { scoreBand, SEVERITY_TOKENS } from "./tokens";

describe("SEVERITY_TOKENS", () => {
  it("has an entry for each severity level", () => {
    expect(Object.keys(SEVERITY_TOKENS).sort()).toEqual(
      ["CRITICAL", "HIGH", "LOW", "MEDIUM"].sort(),
    );
  });

  it("orders severities by weight descending CRITICAL → LOW", () => {
    expect(SEVERITY_TOKENS.CRITICAL.weight).toBeGreaterThan(SEVERITY_TOKENS.HIGH.weight);
    expect(SEVERITY_TOKENS.HIGH.weight).toBeGreaterThan(SEVERITY_TOKENS.MEDIUM.weight);
    expect(SEVERITY_TOKENS.MEDIUM.weight).toBeGreaterThan(SEVERITY_TOKENS.LOW.weight);
  });

  it("uses sentence-case labels", () => {
    expect(SEVERITY_TOKENS.CRITICAL.label).toBe("Critical");
    expect(SEVERITY_TOKENS.HIGH.label).toBe("High");
    expect(SEVERITY_TOKENS.MEDIUM.label).toBe("Medium");
    expect(SEVERITY_TOKENS.LOW.label).toBe("Low");
  });

  it("provides all four utility classes per entry", () => {
    for (const token of Object.values(SEVERITY_TOKENS)) {
      expect(token.dot).toMatch(/^bg-/);
      expect(token.text).toMatch(/^text-/);
      expect(token.border).toMatch(/^border-/);
      expect(token.bg).toMatch(/^bg-/);
    }
  });
});

describe("scoreBand", () => {
  it.each([
    [100, "Excellent"],
    [95, "Excellent"],
    [90, "Excellent"],
    [89, "Good"],
    [70, "Good"],
    [69, "Needs work"],
    [40, "Needs work"],
    [39, "Critical"],
    [0, "Critical"],
  ])("score %i maps to %s", (score, expectedLabel) => {
    expect(scoreBand(score).label).toBe(expectedLabel);
  });

  it("returns stroke and text utility classes", () => {
    const band = scoreBand(75);
    expect(band.ring).toMatch(/^stroke-/);
    expect(band.text).toMatch(/^text-/);
  });
});
