import { describe, expect, it } from "vitest";

import { ALL_RULES, getRulesForFrameworks, isFramework } from "./index";

describe("rules registry", () => {
  it("ALL_RULES contains every authored rule", () => {
    const ids = ALL_RULES.map((r) => r.id);
    expect(ids).toContain("GDPR-001");
    expect(ids).toContain("GDPR-005");
    expect(ids).toContain("AI-ACT-001");
    expect(ids).toContain("AI-ACT-005");
  });

  it("rules have unique ids", () => {
    const ids = ALL_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every rule's id starts with the matching framework prefix", () => {
    for (const rule of ALL_RULES) {
      if (rule.framework === "gdpr") expect(rule.id.startsWith("GDPR-")).toBe(true);
      if (rule.framework === "eu-ai-act") expect(rule.id.startsWith("AI-ACT-")).toBe(true);
    }
  });

  it("getRulesForFrameworks returns only the requested frameworks", () => {
    const onlyGdpr = getRulesForFrameworks(["gdpr"]);
    expect(onlyGdpr.every((r) => r.framework === "gdpr")).toBe(true);
    expect(onlyGdpr.length).toBe(5);
  });

  it("getRulesForFrameworks returns the union when multiple frameworks are passed", () => {
    const both = getRulesForFrameworks(["gdpr", "eu-ai-act"]);
    expect(both.length).toBe(10);
  });

  it("getRulesForFrameworks returns an empty list when no frameworks match", () => {
    expect(getRulesForFrameworks([])).toEqual([]);
  });

  it("isFramework narrows valid strings", () => {
    expect(isFramework("gdpr")).toBe(true);
    expect(isFramework("eu-ai-act")).toBe(true);
    expect(isFramework("hipaa")).toBe(false);
    expect(isFramework("")).toBe(false);
  });
});
