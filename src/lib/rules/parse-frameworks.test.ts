import { describe, expect, it } from "vitest";

import { parseFrameworksArg, parseFrameworksSelection } from "./parse-frameworks";

describe("parseFrameworksArg", () => {
  it("parses a single id", () => {
    expect(parseFrameworksArg("gdpr")).toEqual(["gdpr"]);
  });

  it("parses a comma-separated list preserving order", () => {
    expect(parseFrameworksArg("gdpr,mica")).toEqual(["gdpr", "mica"]);
  });

  it("is case-insensitive and trims whitespace", () => {
    expect(parseFrameworksArg(" GDPR , Mica ")).toEqual(["gdpr", "mica"]);
  });

  it("drops empty segments from trailing/duplicate commas", () => {
    expect(parseFrameworksArg("gdpr,,")).toEqual(["gdpr"]);
  });

  it("de-duplicates repeated ids", () => {
    expect(parseFrameworksArg("gdpr,gdpr")).toEqual(["gdpr"]);
  });

  it("throws a helpful error listing valid ids for an unknown id", () => {
    expect(() => parseFrameworksArg("foo")).toThrow(/unknown framework.*foo/iu);
    expect(() => parseFrameworksArg("foo")).toThrow(/gdpr/u);
  });

  it("throws when the value is empty or only separators", () => {
    expect(() => parseFrameworksArg("")).toThrow(/no framework/iu);
    expect(() => parseFrameworksArg(" , ")).toThrow(/no framework/iu);
  });
});

describe("parseFrameworksSelection", () => {
  it("parses form checkbox values", () => {
    expect(parseFrameworksSelection(["gdpr", "mica"])).toEqual(["gdpr", "mica"]);
  });

  it("throws when nothing is selected", () => {
    expect(() => parseFrameworksSelection([])).toThrow(/no frameworks selected/iu);
  });
});
