export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";
export type Framework = "gdpr" | "eu-ai-act";

export interface ComplianceRule {
  readonly id: string;
  readonly framework: Framework;
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

export type ScanFile = {
  readonly path: string;
  readonly size: number;
  readonly content?: string;
};
