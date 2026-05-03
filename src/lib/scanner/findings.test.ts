// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  DeepScanResponseSchema,
  ReconResponseSchema,
  VerificationResponseSchema,
} from "./findings";

describe("ReconResponseSchema", () => {
  it("accepts a list of paths", () => {
    expect(ReconResponseSchema.parse({ top_paths: ["a.ts", "b.ts"] }).top_paths).toHaveLength(2);
  });

  it("rejects non-string paths", () => {
    expect(() => ReconResponseSchema.parse({ top_paths: [1, 2] })).toThrow();
  });
});

describe("DeepScanResponseSchema", () => {
  it("validates a complete finding", () => {
    const parsed = DeepScanResponseSchema.parse({
      issues: [
        {
          rule_id: "GDPR-001",
          framework: "gdpr",
          file_path: "src/auth.ts",
          line_number: 12,
          code_snippet: "md5(password)",
          title: "Broken hash",
          explanation: "uses md5",
          severity: "CRITICAL",
          legal_reference: "Article 5(1)(f)",
          legal_risk: "Up to €20M",
          fix_description: "use bcrypt",
          fix_code: "bcrypt.hash(p, 12)",
          fix_time_estimate: "~30 minutes",
          confidence: "HIGH",
        },
      ],
      summary: {
        files_analyzed: 1,
        total_issues: 1,
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        key_findings: "Broken password hashing.",
      },
    });
    expect(parsed.issues).toHaveLength(1);
    expect(parsed.summary.critical).toBe(1);
  });

  it("coerces missing line_number to null", () => {
    const parsed = DeepScanResponseSchema.parse({
      issues: [
        {
          rule_id: "GDPR-002",
          framework: "gdpr",
          file_path: "src/x.ts",
          line_number: null,
          code_snippet: "...",
          title: "t",
          explanation: "e",
          severity: "MEDIUM",
          legal_reference: "Art. 17",
          legal_risk: "low",
          fix_description: "fd",
          fix_code: "fc",
          fix_time_estimate: "~1h",
          confidence: "LOW",
        },
      ],
      summary: {
        files_analyzed: 1,
        total_issues: 1,
        critical: 0,
        high: 0,
        medium: 1,
        low: 0,
        key_findings: ".",
      },
    });
    expect(parsed.issues[0]?.line_number).toBeNull();
  });

  it("rejects an unknown severity", () => {
    expect(() =>
      DeepScanResponseSchema.parse({
        issues: [
          {
            rule_id: "X",
            framework: "gdpr",
            file_path: "p",
            line_number: 1,
            code_snippet: ".",
            title: "t",
            explanation: "e",
            severity: "MEGA",
            legal_reference: ".",
            legal_risk: ".",
            fix_description: ".",
            fix_code: ".",
            fix_time_estimate: ".",
            confidence: "HIGH",
          },
        ],
        summary: {
          files_analyzed: 0,
          total_issues: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          key_findings: ".",
        },
      }),
    ).toThrow();
  });
});

describe("VerificationResponseSchema", () => {
  it("accepts verified + dropped sections", () => {
    const parsed = VerificationResponseSchema.parse({ verified: [], dropped: [] });
    expect(parsed.verified).toEqual([]);
    expect(parsed.dropped).toEqual([]);
  });
});
