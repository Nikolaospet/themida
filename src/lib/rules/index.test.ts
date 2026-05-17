import { describe, expect, it } from "vitest";

import {
  ALL_RULES,
  FRAMEWORK_REGISTRY,
  getRulesForFrameworks,
  isFramework,
  listFrameworks,
} from "./index";

describe("rules registry", () => {
  it("FRAMEWORK_REGISTRY exposes every shipped pack", () => {
    expect(Object.keys(FRAMEWORK_REGISTRY)).toEqual(expect.arrayContaining(["gdpr", "eu-ai-act"]));
  });

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

  it("every rule's id starts with its pack ruleIdPrefix", () => {
    for (const rule of ALL_RULES) {
      const pack = FRAMEWORK_REGISTRY[rule.framework as keyof typeof FRAMEWORK_REGISTRY];
      expect(pack, `rule ${rule.id} references unknown framework ${rule.framework}`).toBeDefined();
      expect(rule.id.startsWith(`${pack.meta.ruleIdPrefix}-`)).toBe(true);
    }
  });

  it("getRulesForFrameworks returns only the requested frameworks", () => {
    const onlyGdpr = getRulesForFrameworks(["gdpr"]);
    expect(onlyGdpr.every((r) => r.framework === "gdpr")).toBe(true);
    expect(onlyGdpr.length).toBe(FRAMEWORK_REGISTRY.gdpr.rules.length);
  });

  it("getRulesForFrameworks returns the union when multiple frameworks are passed", () => {
    const both = getRulesForFrameworks(["gdpr", "eu-ai-act"]);
    expect(both.length).toBe(
      FRAMEWORK_REGISTRY.gdpr.rules.length + FRAMEWORK_REGISTRY["eu-ai-act"].rules.length,
    );
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

  it("listFrameworks returns every registered framework id", () => {
    expect(listFrameworks()).toEqual(["gdpr", "eu-ai-act"]);
  });
});
