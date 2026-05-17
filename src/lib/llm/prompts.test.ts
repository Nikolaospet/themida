// @vitest-environment node
import { describe, expect, it } from "vitest";

import { GDPR_001 } from "@/lib/rules/frameworks/gdpr";

import {
  buildDeepScanUserPrompt,
  buildReconUserPrompt,
  buildSystemPrompt,
  buildVerificationUserPrompt,
} from "./prompts";

describe("buildSystemPrompt", () => {
  it("includes the rule id, severity, and legal article", () => {
    const text = buildSystemPrompt([GDPR_001]);
    expect(text).toContain("GDPR-001");
    expect(text).toContain("CRITICAL");
    expect(text).toContain("Article 5(1)(f), Article 32");
    expect(text).toContain("Output ONLY the JSON object");
  });

  it("lists violation and compliance examples", () => {
    const text = buildSystemPrompt([GDPR_001]);
    expect(text).toContain("md5(password)");
    expect(text).toContain("Safe examples");
  });
});

describe("buildReconUserPrompt", () => {
  it("renders one line per file with first-N-line signature", () => {
    const prompt = buildReconUserPrompt([
      { path: "src/auth.ts", content: "export async function login() {\n  return null\n}" },
      { path: "README.md", content: "" },
    ]);
    expect(prompt).toContain("src/auth.ts");
    expect(prompt).toContain("export async function login()");
    expect(prompt).toMatch(/return ONLY a JSON object .*top_paths/u);
  });

  it("caps each file signature at 8 non-empty lines", () => {
    const longContent = Array.from({ length: 30 }, (_, i) => `line-${i}`).join("\n");
    const prompt = buildReconUserPrompt([{ path: "big.ts", content: longContent }]);
    expect(prompt).toContain("line-0");
    expect(prompt).toContain("line-7");
    expect(prompt).not.toContain("line-15");
  });
});

describe("buildDeepScanUserPrompt", () => {
  it("renders each file with a path header and fenced content", () => {
    const prompt = buildDeepScanUserPrompt([
      { path: "src/a.ts", content: "const x = 1" },
      { path: "src/b.ts", content: "const y = 2" },
    ]);
    expect(prompt).toMatch(/=== FILE: src\/a\.ts ===/u);
    expect(prompt).toMatch(/=== FILE: src\/b\.ts ===/u);
    expect(prompt).toContain("const x = 1");
    expect(prompt).toContain("const y = 2");
    expect(prompt).toMatch(/Return ONLY the JSON object/u);
  });
});

describe("buildVerificationUserPrompt", () => {
  it("serialises the findings as JSON inside the prompt", () => {
    const prompt = buildVerificationUserPrompt([
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
    ]);
    expect(prompt).toContain("GDPR-001");
    expect(prompt).toContain("md5(password)");
    expect(prompt).toMatch(/Return ONLY the JSON object/u);
  });
});
