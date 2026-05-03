import type { ComplianceRule } from "@/lib/rules/types";

export type ReconFileInput = {
  readonly path: string;
  readonly content: string;
};

export type DeepScanFileInput = ReconFileInput;

export type VerificationFindingInput = {
  readonly rule_id: string;
  readonly framework: string;
  readonly file_path: string;
  readonly line_number: number | null;
  readonly code_snippet: string;
  readonly title: string;
  readonly explanation: string;
  readonly severity: string;
  readonly legal_reference: string;
  readonly legal_risk: string;
  readonly fix_description: string;
  readonly fix_code: string;
  readonly fix_time_estimate: string;
  readonly confidence: string;
};

const SIGNATURE_LINES = 8;

export function buildSystemPrompt(rules: readonly ComplianceRule[]): string {
  const ruleBlocks = rules
    .map((r) => {
      return [
        `### ${r.id} — ${r.title} [${r.severity}]`,
        `Article: ${r.article}`,
        `Legal Risk: ${r.legalRisk}`,
        `What to detect: ${r.description}`,
        `Code patterns: ${r.codePatterns.join(", ")}`,
        `Violation examples: ${r.violationExamples.join(" | ")}`,
        `Safe examples (NOT violations): ${r.complianceExamples.join(" | ")}`,
      ].join("\n");
    })
    .join("\n\n");

  return [
    "You are a senior compliance security engineer with 15+ years of",
    "experience in GDPR and the EU AI Act. You analyse source code",
    "and report SPECIFIC, VERIFIABLE compliance violations.",
    "",
    "## RULES",
    "1. Only report issues you can see DIRECTLY in the provided code.",
    "2. Every issue MUST cite the exact file path and line number.",
    "3. Every issue MUST include the problematic code snippet.",
    "4. Every issue MUST include a working code fix.",
    "5. If you are not certain, set confidence to LOW. Never guess.",
    "6. Do NOT hallucinate file paths or line numbers.",
    "7. Severity follows: CRITICAL > HIGH > MEDIUM > LOW.",
    "",
    "## COMPLIANCE RULES TO CHECK",
    ruleBlocks,
    "",
    "## OUTPUT",
    "Output ONLY the JSON object requested by the user. Do not wrap in",
    "markdown fences. Do not write any text before or after the JSON.",
  ].join("\n");
}

export function buildReconUserPrompt(files: readonly ReconFileInput[]): string {
  const blocks = files.map((f) => {
    const sig = (f.content ?? "")
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .slice(0, SIGNATURE_LINES)
      .join("\n");
    return `--- ${f.path} ---\n${sig}`;
  });

  return [
    "Below is a list of files with their first-N non-empty lines.",
    "Return the up-to-15 paths most likely to contain a compliance",
    "violation, ordered most-likely first.",
    "",
    'Schema: return ONLY a JSON object {"top_paths": ["path1", "path2", ...]}.',
    "",
    blocks.join("\n\n"),
  ].join("\n");
}

export function buildDeepScanUserPrompt(files: readonly DeepScanFileInput[]): string {
  const fileBlocks = files.map((f) => `=== FILE: ${f.path} ===\n${f.content ?? ""}`).join("\n\n");

  return [
    "Analyse the following code chunk. Find every CONCRETE compliance",
    "violation that you can see in the provided code. For each finding",
    "report the rule_id, framework, file_path, line_number, code_snippet,",
    "title, explanation, severity, legal_reference, legal_risk,",
    "fix_description, fix_code, fix_time_estimate, and confidence.",
    "",
    'Schema: Return ONLY the JSON object {"issues": [...], "summary": {"files_analyzed": <n>, "total_issues": <n>, "critical": <n>, "high": <n>, "medium": <n>, "low": <n>, "key_findings": "<2-sentence summary>"}}.',
    "",
    fileBlocks,
  ].join("\n");
}

export function buildVerificationUserPrompt(findings: readonly VerificationFindingInput[]): string {
  const json = JSON.stringify(findings, null, 2);
  return [
    "Below are findings from the deep-scan pass. For each finding, decide",
    "whether the issue is real and verifiable from the cited code snippet.",
    "Drop hallucinated paths, wrong line numbers, or already-mitigated cases.",
    "Preserve the schema of any verified finding exactly.",
    "",
    'Schema: Return ONLY the JSON object {"verified": [...], "dropped": [{"rule_id": "...", "file_path": "...", "reason": "..."}]}.',
    "",
    json,
  ].join("\n");
}
