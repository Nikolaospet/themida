import type { FrameworkPack } from "../../types";
import meta from "./meta.json";
import { PCI_001 } from "./rules/PCI-001";
import { PCI_002 } from "./rules/PCI-002";
import { PCI_003 } from "./rules/PCI-003";
import { PCI_004 } from "./rules/PCI-004";
import { PCI_005 } from "./rules/PCI-005";

export const PCI_DSS_RULES = [PCI_001, PCI_002, PCI_003, PCI_004, PCI_005] as const;

export const PCI_DSS_PACK: FrameworkPack = {
  meta,
  rules: PCI_DSS_RULES,
};

export { PCI_001, PCI_002, PCI_003, PCI_004, PCI_005 };
