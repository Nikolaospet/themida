import { describe, expect, it } from "vitest";

import { listFrameworks } from "@/lib/rules";

import { resolveScanFrameworks } from "./persist";

describe("resolveScanFrameworks", () => {
  it("returns all shipped frameworks when input is empty", () => {
    expect(resolveScanFrameworks([])).toEqual([...listFrameworks()]);
    expect(resolveScanFrameworks(null)).toEqual([...listFrameworks()]);
  });

  it("normalizes and de-duplicates valid ids", () => {
    expect(resolveScanFrameworks([" GDPR ", "gdpr", "MICA"])).toEqual(["gdpr", "mica"]);
  });

  it("falls back to all frameworks when every id is unknown", () => {
    expect(resolveScanFrameworks(["not-a-pack"])).toEqual([...listFrameworks()]);
  });
});
