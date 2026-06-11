import { describe, expect, it } from "vitest";

import { toSarifLog } from "@/lib/scanner/exporters/sarif";
import type { Database } from "@/types/database";

import { issueRowToCardData, issueRowToFinding } from "./scan-export";

type IssueRow = Database["public"]["Tables"]["issues"]["Row"];

const baseRow: IssueRow = {
  id: "issue-1",
  scan_id: "scan-1",
  user_id: "user-1",
  severity: "CRITICAL",
  rule_id: "GDPR-001",
  framework: "gdpr",
  title: "Password hashed with broken MD5",
  file_path: "src/auth/login.ts",
  line_number: 47,
  code_snippet: "const hash = md5(password)",
  explanation: "MD5 is broken.",
  legal_reference: "GDPR Art. 5(1)(f)",
  legal_risk: "Up to €20M",
  fix_description: "Use bcrypt.",
  fix_code: "await bcrypt.hash(password, 12)",
  fix_time_estimate: "~30 minutes",
  confidence: "HIGH",
  false_positive: false,
  created_at: "2026-05-15T14:00:00Z",
};

describe("scan-export mappers", () => {
  it("coerces nullable issue columns to empty strings for findings", () => {
    const finding = issueRowToFinding({
      ...baseRow,
      code_snippet: null,
      legal_reference: null,
      legal_risk: null,
      fix_description: null,
      fix_code: null,
      fix_time_estimate: null,
    });
    expect(finding.code_snippet).toBe("");
    expect(finding.legal_reference).toBe("");
    expect(finding.fix_code).toBe("");
    expect(finding.confidence).toBe("HIGH");
    // Fields the SARIF exporter actually reads survive intact.
    expect(finding.rule_id).toBe("GDPR-001");
    expect(finding.framework).toBe("gdpr");
    expect(finding.line_number).toBe(47);
  });

  it("produces a SARIF log the exporter accepts", () => {
    const log = toSarifLog([issueRowToFinding(baseRow)]);
    const run = log.runs[0]!;
    const result = run.results[0]!;
    expect(result.ruleId).toBe("GDPR-001");
    expect(result.level).toBe("error"); // CRITICAL → error
    expect(result.locations[0]!.physicalLocation.region.startLine).toBe(47);
    expect(run.tool.driver.rules[0]!.id).toBe("GDPR-001");
  });

  it("preserves nullable fields as-is for the PDF card data", () => {
    const card = issueRowToCardData({ ...baseRow, code_snippet: null, line_number: null });
    expect(card.code_snippet).toBeNull();
    expect(card.line_number).toBeNull();
    expect(card.title).toBe("Password hashed with broken MD5");
  });
});
