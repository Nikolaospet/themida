import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { MICA_001 } from "./rules/MICA-001";
import { MICA_002 } from "./rules/MICA-002";
import { MICA_003 } from "./rules/MICA-003";
import { MICA_004 } from "./rules/MICA-004";
import { MICA_005 } from "./rules/MICA-005";

export const MICA_RULES = [MICA_001, MICA_002, MICA_003, MICA_004, MICA_005] as const;

export const MICA_PACK: FrameworkPack = {
  meta,
  rules: MICA_RULES,
};

export { MICA_001, MICA_002, MICA_003, MICA_004, MICA_005 };
