import { z } from "zod";

import type { FrameworkPack } from "./types";

const SEVERITY = ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const;

const FindingTemplateSchema = z.object({
  explanation: z.string().min(1),
  fixDescription: z.string().min(1),
  fixCodeTemplate: z.string().min(1),
  estimatedFixTime: z.string().min(1),
  references: z.array(z.string().url()).min(1),
});

export const ComplianceRuleSchema = z.object({
  id: z.string().min(1),
  framework: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/u, "expected semver-style version"),
  article: z.string().min(1),
  legalText: z.string().min(1),
  legalSource: z.string().url(),
  legalRisk: z.string().min(1),
  severity: z.enum(SEVERITY),
  title: z.string().min(1),
  description: z.string().min(1),
  codePatterns: z.array(z.string()),
  keywords: z.array(z.string()),
  fileTypes: z.array(z.string().regex(/^\.[A-Za-z0-9]+$/u, "fileTypes entries start with a dot")),
  violationExamples: z.array(z.string()),
  complianceExamples: z.array(z.string()),
  findingTemplate: FindingTemplateSchema,
});

export const FrameworkPackSchema = z.object({
  meta: z.object({
    id: z.string().min(1),
    displayName: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+$/u),
    regulationUrl: z.string().url(),
    ruleIdPrefix: z.string().regex(/^[A-Z][A-Z0-9-]+$/u),
  }),
  rules: z.array(ComplianceRuleSchema),
});

/**
 * Validates a framework pack: schema, rule-id uniqueness, rule-id prefix
 * matches the pack's `meta.ruleIdPrefix`, and every rule's `framework`
 * matches the pack's `meta.id`.
 *
 * Returns the list of human-readable issues (empty when the pack is OK).
 */
export function validatePack(pack: FrameworkPack): string[] {
  const issues: string[] = [];
  const parsed = FrameworkPackSchema.safeParse(pack);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      issues.push(`schema: ${issue.path.join(".")} — ${issue.message}`);
    }
    // Cross-rule checks only make sense once the shape is valid.
    return issues;
  }

  const prefix = pack.meta.ruleIdPrefix;
  const seen = new Set<string>();
  for (const rule of pack.rules) {
    if (rule.framework !== pack.meta.id) {
      issues.push(
        `${rule.id}: framework '${rule.framework}' does not match pack id '${pack.meta.id}'`,
      );
    }
    if (!rule.id.startsWith(`${prefix}-`)) {
      issues.push(`${rule.id}: id does not start with pack prefix '${prefix}-'`);
    }
    if (seen.has(rule.id)) {
      issues.push(`${rule.id}: duplicate rule id within pack`);
    }
    seen.add(rule.id);
  }
  return issues;
}
