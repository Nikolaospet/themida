import type { FrameworkPack } from "../types";
import { EU_AI_ACT_PACK } from "./eu-ai-act";
import { GDPR_PACK } from "./gdpr";

/**
 * Single source of truth for which framework packs ship in this build.
 *
 * Adding a new framework: import its pack, add one line below. The rest
 * of the codebase (rules union type, eval manifest validation, rule
 * lookup) derives from this registry.
 */
export const FRAMEWORK_REGISTRY = {
  gdpr: GDPR_PACK,
  "eu-ai-act": EU_AI_ACT_PACK,
} as const satisfies Record<string, FrameworkPack>;

export type Framework = keyof typeof FRAMEWORK_REGISTRY;
