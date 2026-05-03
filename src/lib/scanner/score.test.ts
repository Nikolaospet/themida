// @vitest-environment node
import { describe, expect, it } from "vitest";

import type { RawFinding } from "./findings";
import { calculateComplianceScore } from "./score";

const finding = (
  severity: RawFinding["severity"],
  confidence: RawFinding["confidence"] = "HIGH",
): RawFinding => ({
  rule_id: "GDPR-001",
  framework: "gdpr",
  file_path: "src/a.ts",
  line_number: 1,
  code_snippet: "x",
  title: "t",
  explanation: "e",
  severity,
  legal_reference: ".",
  legal_risk: ".",
  fix_description: ".",
  fix_code: ".",
  fix_time_estimate: ".",
  confidence,
});

describe("calculateComplianceScore", () => {
  it("returns 100 for an empty list", () => {
    expect(calculateComplianceScore([])).toBe(100);
  });

  it("deducts 25 per CRITICAL", () => {
    expect(calculateComplianceScore([finding("CRITICAL")])).toBe(75);
  });

  it("deducts 10 per HIGH, 4 per MEDIUM, 1 per LOW", () => {
    expect(calculateComplianceScore([finding("HIGH"), finding("MEDIUM"), finding("LOW")])).toBe(85);
  });

  it("ignores LOW-confidence findings", () => {
    expect(calculateComplianceScore([finding("CRITICAL", "LOW")])).toBe(100);
  });

  it("clamps at 0", () => {
    const five = Array.from({ length: 5 }, () => finding("CRITICAL"));
    expect(calculateComplianceScore(five)).toBe(0);
  });
});
