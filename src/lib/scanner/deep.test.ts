// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GDPR_001 } from "@/lib/rules/gdpr";

import { runDeepScanPass } from "./deep";

const callAnthropicMock = vi.fn();
vi.mock("@/lib/llm/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => callAnthropicMock(...args),
}));

beforeEach(() => {
  callAnthropicMock.mockReset();
});

function deepScanResponse(ruleId: string, file: string) {
  return {
    text: JSON.stringify({
      issues: [
        {
          rule_id: ruleId,
          framework: "gdpr",
          file_path: file,
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
        },
      ],
      summary: {
        files_analyzed: 1,
        total_issues: 1,
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        key_findings: "x",
      },
    }),
    inputTokens: 200,
    outputTokens: 50,
    durationMs: 80,
    requestId: "r",
    model: "claude-sonnet-4-6",
    provider: "anthropic",
  };
}

describe("runDeepScanPass", () => {
  it("flattens findings from every chunk", async () => {
    callAnthropicMock
      .mockResolvedValueOnce(deepScanResponse("GDPR-001", "src/a.ts"))
      .mockResolvedValueOnce(deepScanResponse("GDPR-001", "src/b.ts"));

    const findings = await runDeepScanPass(
      [
        [{ path: "src/a.ts", size: 5, content: "md5(password)" }],
        [{ path: "src/b.ts", size: 5, content: "md5(password)" }],
      ],
      [GDPR_001],
    );

    expect(findings.map((f) => f.file_path).sort()).toEqual(["src/a.ts", "src/b.ts"]);
    expect(callAnthropicMock).toHaveBeenCalledTimes(2);
  });

  it("respects the concurrency cap (default 2)", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    callAnthropicMock.mockImplementation(async (_messages: unknown, options: { pass: string }) => {
      expect(options.pass).toBe("deep_scan");
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight -= 1;
      return deepScanResponse("GDPR-001", "x");
    });

    const chunks = Array.from({ length: 6 }, (_, i) => [
      { path: `src/${i}.ts`, size: 5, content: "md5(password)" },
    ]);
    await runDeepScanPass(chunks, [GDPR_001]);
    expect(maxInFlight).toBeLessThanOrEqual(2);
  });

  it("returns empty list when given no chunks", async () => {
    const findings = await runDeepScanPass([], [GDPR_001]);
    expect(findings).toEqual([]);
    expect(callAnthropicMock).not.toHaveBeenCalled();
  });

  it("retries a chunk once on JSON parse failure", async () => {
    callAnthropicMock
      .mockResolvedValueOnce({
        text: "not json",
        inputTokens: 0,
        outputTokens: 0,
        durationMs: 0,
        requestId: "r",
        model: "claude-sonnet-4-6",
        provider: "anthropic",
      })
      .mockResolvedValueOnce(deepScanResponse("GDPR-001", "src/a.ts"));

    const findings = await runDeepScanPass(
      [[{ path: "src/a.ts", size: 5, content: "md5(password)" }]],
      [GDPR_001],
    );
    expect(findings).toHaveLength(1);
    expect(callAnthropicMock).toHaveBeenCalledTimes(2);
  });
});
