import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { OWASP_001 } from "./rules/OWASP-001";
import { OWASP_002 } from "./rules/OWASP-002";
import { OWASP_003 } from "./rules/OWASP-003";
import { OWASP_004 } from "./rules/OWASP-004";
import { OWASP_005 } from "./rules/OWASP-005";

export const OWASP_RULES = [OWASP_001, OWASP_002, OWASP_003, OWASP_004, OWASP_005] as const;

export const OWASP_PACK: FrameworkPack = {
  meta,
  rules: OWASP_RULES,
};

export { OWASP_001, OWASP_002, OWASP_003, OWASP_004, OWASP_005 };
