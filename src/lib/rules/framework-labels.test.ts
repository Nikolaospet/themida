import { describe, expect, it } from "vitest";

import { formatFrameworkLabels } from "./framework-labels";

describe("formatFrameworkLabels", () => {
  it("maps ids to display names", () => {
    expect(formatFrameworkLabels(["gdpr", "eu-ai-act"])).toBe("GDPR, EU AI Act");
  });

  it("passes through unknown ids", () => {
    expect(formatFrameworkLabels(["unknown-pack"])).toBe("unknown-pack");
  });
});
