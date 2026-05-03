// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GDPR_001 } from "@/lib/rules/gdpr";

import type { RawFinding } from "./findings";
import { runVerificationPass } from "./verify";

const callOpenRouterMock = vi.fn();
vi.mock("@/lib/llm/openrouter", () => ({
  callOpenRouter: (...args: unknown[]) => callOpenRouterMock(...args),
}));

beforeEach(() => {
  callOpenRouterMock.mockReset();
});

const finding = (i: number): RawFinding => ({
  rule_id: "GDPR-001",
  framework: "gdpr",
  file_path: `src/${i}.ts`,
  line_number: 1,
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
});

function verificationResponse(verified: RawFinding[]) {
  return {
    text: JSON.stringify({ verified, dropped: [] }),
    inputTokens: 100,
    outputTokens: 30,
    durationMs: 40,
    requestId: "r",
    model: "google/gemma-4-31b-it:free",
    provider: "openrouter",
  };
}

describe("runVerificationPass", () => {
  it("returns the verified findings only", async () => {
    callOpenRouterMock.mockResolvedValueOnce(verificationResponse([finding(1)]));
    const verified = await runVerificationPass([finding(1), finding(2)], [GDPR_001]);
    expect(verified).toHaveLength(1);
    expect(verified[0]?.file_path).toBe("src/1.ts");
  });

  it("does not call the LLM when given no findings", async () => {
    const verified = await runVerificationPass([], [GDPR_001]);
    expect(verified).toEqual([]);
    expect(callOpenRouterMock).not.toHaveBeenCalled();
  });

  it("batches large finding lists into groups of 30", async () => {
    const findings = Array.from({ length: 65 }, (_, i) => finding(i));
    callOpenRouterMock.mockImplementation(async () => verificationResponse(findings.slice(0, 30)));
    await runVerificationPass(findings, [GDPR_001]);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(3); // 30 + 30 + 5
  });

  it("retries once on JSON parse failure", async () => {
    callOpenRouterMock
      .mockResolvedValueOnce({
        text: "garbage",
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        requestId: "r",
        model: "google/gemma-4-31b-it:free",
        provider: "openrouter",
      })
      .mockResolvedValueOnce(verificationResponse([finding(1)]));
    const verified = await runVerificationPass([finding(1)], [GDPR_001]);
    expect(verified).toHaveLength(1);
    expect(callOpenRouterMock).toHaveBeenCalledTimes(2);
  });
});
