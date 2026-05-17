import { z } from "zod";

import { type Framework, FRAMEWORK_REGISTRY } from "@/lib/rules";

// Framework ids and rule-id prefixes are derived from the registry so the
// schema rejects any framework not listed there, and any rule_id whose
// prefix does not match one of the registered packs.

const FRAMEWORK_IDS = Object.keys(FRAMEWORK_REGISTRY) as unknown as readonly [
  Framework,
  ...Framework[],
];

const RULE_ID_PATTERN = new RegExp(
  `^(?:${Object.values(FRAMEWORK_REGISTRY)
    .map((pack) => pack.meta.ruleIdPrefix.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&"))
    .join("|")})-\\d{3}$`,
  "u",
);

export const ExpectedFindingSchema = z.object({
  rule_id: z.string().regex(RULE_ID_PATTERN),
  file_path: z.string().min(1),
  line_number_approx: z.number().int().positive().optional(),
});

export const ManifestSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  frameworks: z.array(z.enum(FRAMEWORK_IDS)).min(1),
  expected_findings: z.array(ExpectedFindingSchema),
});

export type Manifest = z.infer<typeof ManifestSchema>;
export type ExpectedFinding = z.infer<typeof ExpectedFindingSchema>;
