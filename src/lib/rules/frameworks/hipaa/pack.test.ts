import { describe, expect, it } from "vitest";

import { validatePack } from "../../pack.zod";
import { HIPAA_PACK } from "./index";

describe("hipaa pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(HIPAA_PACK)).toEqual([]);
  });
});
