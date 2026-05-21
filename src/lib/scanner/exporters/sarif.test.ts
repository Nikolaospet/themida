// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { VerifiedFinding } from "../findings";
import { SARIF_SCHEMA_URI, SARIF_VERSION, toSarifLog, toSarifString } from "./sarif";

const finding = (over: Partial<VerifiedFinding> = {}): VerifiedFinding => ({
  rule_id: "GDPR-001",
  framework: "gdpr",
  file_path: "src/auth/login.ts",
  line_number: 12,
  code_snippet: "md5(password)",
  title: "Weak password hash",
  explanation: "Passwords are hashed with MD5, which is broken.",
  severity: "CRITICAL",
  legal_reference: "Article 5(1)(f)",
  legal_risk: "Up to €20M or 4% of global turnover.",
  fix_description: "Use bcrypt/argon2.",
  fix_code: "await bcrypt.hash(password, 12)",
  fix_time_estimate: "~30 minutes",
  confidence: "HIGH",
  ...over,
});

describe("toSarifLog", () => {
  it("emits a SARIF 2.1.0 log envelope", () => {
    const log = toSarifLog([finding()]);
    expect(log.version).toBe(SARIF_VERSION);
    expect(log.version).toBe("2.1.0");
    expect(log.$schema).toBe(SARIF_SCHEMA_URI);
    expect(log.runs).toHaveLength(1);
    expect(log.runs[0]!.tool.driver.name).toBe("Themida");
    expect(log.runs[0]!.tool.driver.informationUri).toMatch(/^https?:\/\//u);
  });

  it("maps each finding to a result with a physical location", () => {
    const log = toSarifLog([finding()]);
    const result = log.runs[0]!.results[0]!;
    expect(result.ruleId).toBe("GDPR-001");
    const loc = result.locations[0]!.physicalLocation;
    expect(loc.artifactLocation.uri).toBe("src/auth/login.ts");
    expect(loc.region.startLine).toBe(12);
    expect(result.message.text.length).toBeGreaterThan(0);
  });

  it("defaults a null line number to line 1 (SARIF startLine must be >= 1)", () => {
    const log = toSarifLog([finding({ line_number: null })]);
    expect(log.runs[0]!.results[0]!.locations[0]!.physicalLocation.region.startLine).toBe(1);
  });

  it("maps severity to SARIF level", () => {
    const levelFor = (s: VerifiedFinding["severity"]) =>
      toSarifLog([finding({ severity: s })]).runs[0]!.results[0]!.level;
    expect(levelFor("CRITICAL")).toBe("error");
    expect(levelFor("HIGH")).toBe("error");
    expect(levelFor("MEDIUM")).toBe("warning");
    expect(levelFor("LOW")).toBe("note");
  });

  it("deduplicates rules and carries helpUri + security-severity for Code Scanning", () => {
    const log = toSarifLog([finding(), finding({ file_path: "src/b.ts" })]);
    const rules = log.runs[0]!.tool.driver.rules;
    expect(rules).toHaveLength(1); // two findings, same rule
    const rule = rules[0]!;
    expect(rule.id).toBe("GDPR-001");
    expect(rule.helpUri).toMatch(/^https?:\/\//u); // resolved from the rule's legalSource
    expect(rule.properties["security-severity"]).toBe("9.5"); // CRITICAL
    expect(rule.properties.tags).toContain("gdpr");
    // every result references a declared rule
    for (const r of log.runs[0]!.results) {
      expect(rules.some((rd) => rd.id === r.ruleId)).toBe(true);
    }
  });

  it("sets stable partialFingerprints so re-runs dedupe in the Security tab", () => {
    const a = toSarifLog([finding()]).runs[0]!.results[0]!;
    const b = toSarifLog([finding()]).runs[0]!.results[0]!;
    expect(a.partialFingerprints).toBeDefined();
    expect(a.partialFingerprints).toEqual(b.partialFingerprints);
  });

  it("toSarifString returns parseable, indented JSON", () => {
    const str = toSarifString([finding()]);
    expect(str).toContain("\n  ");
    expect(() => JSON.parse(str)).not.toThrow();
    expect(JSON.parse(str).version).toBe("2.1.0");
  });

  it("handles an empty findings list (valid empty run)", () => {
    const log = toSarifLog([]);
    expect(log.runs[0]!.results).toEqual([]);
    expect(log.runs[0]!.tool.driver.rules).toEqual([]);
  });
});
