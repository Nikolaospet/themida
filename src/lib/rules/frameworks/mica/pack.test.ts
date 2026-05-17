import { describe, expect, it } from "vitest";

import { validatePack } from "../../pack.zod";
import { MICA_PACK } from "./index";

describe("mica pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(MICA_PACK)).toEqual([]);
  });
});
