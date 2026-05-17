import { describe, expect, it } from "vitest";

import { validatePack } from "../../pack.zod";
import { EU_AI_ACT_PACK } from "./index";

describe("eu-ai-act pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(EU_AI_ACT_PACK)).toEqual([]);
  });
});
