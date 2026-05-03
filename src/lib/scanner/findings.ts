import { z } from "zod";

const SeverityEnum = z.enum(["CRITICAL", "HIGH", "MEDIUM", "LOW"]);
const ConfidenceEnum = z.enum(["HIGH", "MEDIUM", "LOW"]);

export const RawFindingSchema = z.object({
  rule_id: z.string().min(1),
  framework: z.string().min(1),
  file_path: z.string().min(1),
  line_number: z.number().int().nullable(),
  code_snippet: z.string(),
  title: z.string().min(1),
  explanation: z.string().min(1),
  severity: SeverityEnum,
  legal_reference: z.string(),
  legal_risk: z.string(),
  fix_description: z.string(),
  fix_code: z.string(),
  fix_time_estimate: z.string(),
  confidence: ConfidenceEnum,
});
export type RawFinding = z.infer<typeof RawFindingSchema>;

export const DeepScanSummarySchema = z.object({
  files_analyzed: z.number().int().nonnegative(),
  total_issues: z.number().int().nonnegative(),
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  medium: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
  key_findings: z.string(),
});
export type DeepScanSummary = z.infer<typeof DeepScanSummarySchema>;

export const ReconResponseSchema = z.object({
  top_paths: z.array(z.string().min(1)),
});
export type ReconResponse = z.infer<typeof ReconResponseSchema>;

export const DeepScanResponseSchema = z.object({
  issues: z.array(RawFindingSchema),
  summary: DeepScanSummarySchema,
});
export type DeepScanResponse = z.infer<typeof DeepScanResponseSchema>;

export const VerificationResponseSchema = z.object({
  verified: z.array(RawFindingSchema),
  dropped: z.array(
    z.object({
      rule_id: z.string(),
      file_path: z.string(),
      reason: z.string(),
    }),
  ),
});
export type VerificationResponse = z.infer<typeof VerificationResponseSchema>;

export type VerifiedFinding = RawFinding;

export type ScanStats = {
  readonly filesScanned: number;
  readonly chunks: number;
  readonly findingsRaw: number;
  readonly findingsVerified: number;
  readonly durationMs: number;
};

export type ScanResult = {
  readonly findings: readonly VerifiedFinding[];
  readonly score: number;
  readonly stats: ScanStats;
};
