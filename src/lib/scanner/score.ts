import type { RawFinding } from "./findings";

const WEIGHTS = {
  CRITICAL: 25,
  HIGH: 10,
  MEDIUM: 4,
  LOW: 1,
} as const;

export function calculateComplianceScore(findings: readonly RawFinding[]): number {
  if (findings.length === 0) return 100;

  const confirmed = findings.filter((f) => f.confidence !== "LOW");
  const deductions = confirmed.reduce((acc, f) => acc + WEIGHTS[f.severity], 0);
  return Math.max(0, 100 - deductions);
}
