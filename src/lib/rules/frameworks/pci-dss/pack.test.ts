import { describe, expect, it } from "vitest";

import { validatePack } from "../../pack.zod";
import { PCI_DSS_PACK } from "./index";

describe("pci-dss pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(PCI_DSS_PACK)).toEqual([]);
  });
});
