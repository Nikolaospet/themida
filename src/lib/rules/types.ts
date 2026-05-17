export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

/**
 * Framework id at the type level. Runtime values are constrained by the
 * `FRAMEWORK_REGISTRY` in `./frameworks/registry`. The narrowed literal
 * union type (`"gdpr" | "eu-ai-act" | …`) is exported as `Framework`
 * from `./index`.
 */
export type FrameworkId = string;

export interface FrameworkMeta {
  readonly id: FrameworkId;
  readonly displayName: string;
  readonly version: string;
  readonly regulationUrl: string;
  /** Prefix every rule id in this pack must start with (e.g. `GDPR`, `AI-ACT`). */
  readonly ruleIdPrefix: string;
}

export interface ComplianceRule {
  readonly id: string;
  readonly framework: FrameworkId;
  readonly version: string;

  // Legal basis ----------------------------------------------------------
  readonly article: string;
  readonly legalText: string;
  readonly legalSource: string;
  readonly legalRisk: string;

  // Detection ------------------------------------------------------------
  readonly severity: Severity;
  readonly title: string;
  readonly description: string;

  readonly codePatterns: readonly string[];
  readonly keywords: readonly string[];
  readonly fileTypes: readonly string[];

  readonly violationExamples: readonly string[];
  readonly complianceExamples: readonly string[];

  // AI-rendered output ---------------------------------------------------
  readonly findingTemplate: Readonly<{
    explanation: string;
    fixDescription: string;
    fixCodeTemplate: string;
    estimatedFixTime: string;
    references: readonly string[];
  }>;
}

export interface FrameworkPack {
  readonly meta: FrameworkMeta;
  readonly rules: readonly ComplianceRule[];
}

export type ScanFile = {
  readonly path: string;
  readonly size: number;
  readonly content?: string;
};
