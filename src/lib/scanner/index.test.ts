// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { runComplianceScan } from "./index";

const callAnthropicMock = vi.fn();
vi.mock("@/lib/llm/anthropic", () => ({
  callAnthropic: (...args: unknown[]) => callAnthropicMock(...args),
}));

beforeEach(() => {
  callAnthropicMock.mockReset();
});

const md5File = "import md5 from 'md5'\nconst hash = md5(password)\n";

const reconResp = (paths: string[]) => ({
  text: JSON.stringify({ top_paths: paths }),
  inputTokens: 100,
  outputTokens: 20,
  durationMs: 50,
  requestId: "r",
  model: "claude-sonnet-4-6",
  provider: "anthropic",
});

const deepResp = (paths: string[]) => ({
  text: JSON.stringify({
    issues: paths.map((p) => ({
      rule_id: "GDPR-001",
      framework: "gdpr",
      file_path: p,
      line_number: 2,
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
    })),
    summary: {
      files_analyzed: paths.length,
      total_issues: paths.length,
      critical: paths.length,
      high: 0,
      medium: 0,
      low: 0,
      key_findings: ".",
    },
  }),
  inputTokens: 300,
  outputTokens: 60,
  durationMs: 80,
  requestId: "r",
  model: "claude-sonnet-4-6",
  provider: "anthropic",
});

const verifyResp = (paths: string[]) => ({
  text: JSON.stringify({
    verified: paths.map((p) => ({
      rule_id: "GDPR-001",
      framework: "gdpr",
      file_path: p,
      line_number: 2,
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
    })),
    dropped: [],
  }),
  inputTokens: 100,
  outputTokens: 40,
  durationMs: 30,
  requestId: "r",
  model: "claude-sonnet-4-6",
  provider: "anthropic",
});

describe("runComplianceScan", () => {
  it("runs recon → deep → verify → score on a happy path", async () => {
    callAnthropicMock
      .mockResolvedValueOnce(reconResp(["src/auth.ts"]))
      .mockResolvedValueOnce(deepResp(["src/auth.ts"]))
      .mockResolvedValueOnce(verifyResp(["src/auth.ts"]));

    const result = await runComplianceScan({
      files: [{ path: "src/auth.ts", size: md5File.length, content: md5File }],
      frameworks: ["gdpr"],
    });

    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.rule_id).toBe("GDPR-001");
    expect(result.score).toBe(75);
    expect(result.stats.findingsRaw).toBe(1);
    expect(result.stats.findingsVerified).toBe(1);
    expect(callAnthropicMock).toHaveBeenCalledTimes(3);
  });

  it("short-circuits when filtering yields zero files", async () => {
    const result = await runComplianceScan({ files: [], frameworks: ["gdpr"] });
    expect(result.findings).toEqual([]);
    expect(result.score).toBe(100);
    expect(callAnthropicMock).not.toHaveBeenCalled();
  });

  it("skips deep + verify when recon returns no paths", async () => {
    callAnthropicMock.mockResolvedValueOnce(reconResp([]));
    const result = await runComplianceScan({
      files: [{ path: "src/auth.ts", size: 5, content: md5File }],
      frameworks: ["gdpr"],
    });
    expect(result.findings).toEqual([]);
    expect(result.score).toBe(100);
    expect(callAnthropicMock).toHaveBeenCalledTimes(1);
  });

  it("propagates an unknown framework as an error", async () => {
    await expect(
      runComplianceScan({
        files: [{ path: "src/auth.ts", size: 5, content: md5File }],
        // @ts-expect-error — intentional
        frameworks: ["nope"],
      }),
    ).rejects.toThrow(/framework/u);
  });
});
