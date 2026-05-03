import { z } from "zod";

export const ExpectedFindingSchema = z.object({
  rule_id: z.string().regex(/^(?:GDPR|AI-ACT)-\d{3}$/u),
  file_path: z.string().min(1),
  line_number_approx: z.number().int().positive().optional(),
});

export const ManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  frameworks: z.array(z.enum(["gdpr", "eu-ai-act"])).min(1),
  expected_findings: z.array(ExpectedFindingSchema),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type ExpectedFinding = z.infer<typeof ExpectedFindingSchema>;
