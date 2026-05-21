import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { HIPAA_001 } from "./rules/HIPAA-001";
import { HIPAA_002 } from "./rules/HIPAA-002";
import { HIPAA_003 } from "./rules/HIPAA-003";
import { HIPAA_004 } from "./rules/HIPAA-004";
import { HIPAA_005 } from "./rules/HIPAA-005";

export const HIPAA_RULES = [HIPAA_001, HIPAA_002, HIPAA_003, HIPAA_004, HIPAA_005] as const;

export const HIPAA_PACK: FrameworkPack = {
  meta,
  rules: HIPAA_RULES,
};

export { HIPAA_001, HIPAA_002, HIPAA_003, HIPAA_004, HIPAA_005 };
