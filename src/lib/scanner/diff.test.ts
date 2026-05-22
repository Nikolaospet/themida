// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { localDiffPaths, parseDiffRange, parseNameOnly } from "./diff";

describe("parseDiffRange", () => {
  it("accepts two-dot and three-dot ranges", () => {
    expect(parseDiffRange("main..HEAD")).toBe("main..HEAD");
    expect(parseDiffRange("origin/main...feature")).toBe("origin/main...feature");
    expect(parseDiffRange("  main..HEAD  ")).toBe("main..HEAD");
  });

  it("rejects non-range input", () => {
    expect(() => parseDiffRange("HEAD")).toThrow(/invalid --diff range/u);
    expect(() => parseDiffRange("main HEAD")).toThrow(/invalid --diff range/u);
    expect(() => parseDiffRange("")).toThrow(/invalid --diff range/u);
  });
});

describe("parseNameOnly", () => {
  it("splits, trims, and dedupes git output", () => {
    const set = parseNameOnly("src/a.ts\nsrc/b.ts\n\n  src/a.ts  \n");
    expect([...set].sort()).toEqual(["src/a.ts", "src/b.ts"]);
  });

  it("returns an empty set for empty output", () => {
    expect(parseNameOnly("\n  \n")).toEqual(new Set());
  });
});

describe("localDiffPaths", () => {
  it("invokes git diff --name-only with the validated range and parses output", () => {
    const run = vi.fn().mockReturnValue("src/auth/login.ts\nsrc/api/users.ts\n");
    const paths = localDiffPaths("main..HEAD", run);
    expect(run).toHaveBeenCalledWith(["diff", "--name-only", "main..HEAD"]);
    expect([...paths].sort()).toEqual(["src/api/users.ts", "src/auth/login.ts"]);
  });

  it("validates the range before shelling out", () => {
    const run = vi.fn();
    expect(() => localDiffPaths("not a range", run)).toThrow(/invalid --diff range/u);
    expect(run).not.toHaveBeenCalled();
  });
});
