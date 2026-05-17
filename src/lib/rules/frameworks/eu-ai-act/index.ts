import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { AI_ACT_001 } from "./rules/AI-ACT-001";
import { AI_ACT_002 } from "./rules/AI-ACT-002";
import { AI_ACT_003 } from "./rules/AI-ACT-003";
import { AI_ACT_004 } from "./rules/AI-ACT-004";
import { AI_ACT_005 } from "./rules/AI-ACT-005";

export const EU_AI_ACT_RULES = [
  AI_ACT_001,
  AI_ACT_002,
  AI_ACT_003,
  AI_ACT_004,
  AI_ACT_005,
] as const;

export const EU_AI_ACT_PACK: FrameworkPack = {
  meta,
  rules: EU_AI_ACT_RULES,
};

export { AI_ACT_001, AI_ACT_002, AI_ACT_003, AI_ACT_004, AI_ACT_005 };
