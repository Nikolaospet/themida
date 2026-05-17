import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { GDPR_001 } from "./rules/GDPR-001";
import { GDPR_002 } from "./rules/GDPR-002";
import { GDPR_003 } from "./rules/GDPR-003";
import { GDPR_004 } from "./rules/GDPR-004";
import { GDPR_005 } from "./rules/GDPR-005";

export const GDPR_RULES = [GDPR_001, GDPR_002, GDPR_003, GDPR_004, GDPR_005] as const;

export const GDPR_PACK: FrameworkPack = {
  meta,
  rules: GDPR_RULES,
};

export { GDPR_001, GDPR_002, GDPR_003, GDPR_004, GDPR_005 };
