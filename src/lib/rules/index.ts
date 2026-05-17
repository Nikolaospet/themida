import { type Framework, FRAMEWORK_REGISTRY } from "./frameworks/registry";
import type { ComplianceRule } from "./types";

export type { Framework };
export type {
  ComplianceRule,
  Confidence,
  FrameworkId,
  FrameworkMeta,
  FrameworkPack,
  ScanFile,
  Severity,
} from "./types";
export { FRAMEWORK_REGISTRY };

const SUPPORTED_FRAMEWORKS = Object.keys(FRAMEWORK_REGISTRY) as readonly Framework[];

export const ALL_RULES: readonly ComplianceRule[] = Object.freeze(
  Object.values(FRAMEWORK_REGISTRY).flatMap((pack) => [...pack.rules]),
);

export function isFramework(value: string): value is Framework {
  return (SUPPORTED_FRAMEWORKS as readonly string[]).includes(value);
}

export function getRulesForFrameworks(frameworks: readonly Framework[]): readonly ComplianceRule[] {
  if (frameworks.length === 0) return [];
  const set = new Set<Framework>(frameworks);
  return ALL_RULES.filter((rule) => set.has(rule.framework as Framework));
}

/** All framework ids that ship in this build, in registry order. */
export function listFrameworks(): readonly Framework[] {
  return SUPPORTED_FRAMEWORKS;
}
