import { describe, expect, it } from "vitest";

import { validatePack } from "../../pack.zod";
import { OWASP_PACK } from "./index";

describe("owasp pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(OWASP_PACK)).toEqual([]);
  });
});
