import { EU_AI_ACT_RULES } from "./eu-ai-act";
import { GDPR_RULES } from "./gdpr";
import type { ComplianceRule, Framework } from "./types";

export type { ComplianceRule, Confidence, Framework, ScanFile, Severity } from "./types";

export const ALL_RULES: readonly ComplianceRule[] = [...GDPR_RULES, ...EU_AI_ACT_RULES] as const;

const SUPPORTED_FRAMEWORKS: readonly Framework[] = ["gdpr", "eu-ai-act"];

export function isFramework(value: string): value is Framework {
  return (SUPPORTED_FRAMEWORKS as readonly string[]).includes(value);
}

export function getRulesForFrameworks(frameworks: readonly Framework[]): readonly ComplianceRule[] {
  if (frameworks.length === 0) return [];
  const set = new Set<Framework>(frameworks);
  return ALL_RULES.filter((rule) => set.has(rule.framework));
}
