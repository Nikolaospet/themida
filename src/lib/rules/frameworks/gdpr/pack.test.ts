import { describe, expect, it } from "vitest";

import { validatePack } from "../../pack.zod";
import { GDPR_PACK } from "./index";

describe("gdpr pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(GDPR_PACK)).toEqual([]);
  });
});
