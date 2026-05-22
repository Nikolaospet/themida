import { describe, expect, it } from "vitest";

import { filterRepoFiles } from "./filter";
import type { ScannerFile } from "./types";

const f = (path: string, size = 1000, content?: string): ScannerFile => ({
  path,
  size,
  ...(content !== undefined ? { content } : {}),
});

describe("filterRepoFiles", () => {
  it("drops files matching ignore patterns", () => {
    const files: ScannerFile[] = [
      f("src/auth/login.ts"),
      f("node_modules/foo/index.js"),
      f("dist/bundle.js"),
      f(".next/server.js"),
      f("src/api/users.test.ts"),
    ];
    const kept = filterRepoFiles(files).map((x) => x.path);
    expect(kept).toContain("src/auth/login.ts");
    expect(kept).not.toContain("node_modules/foo/index.js");
    expect(kept).not.toContain("dist/bundle.js");
    expect(kept).not.toContain(".next/server.js");
    expect(kept).not.toContain("src/api/users.test.ts");
  });

  it("ranks high-priority paths above unrelated files", () => {
    const files: ScannerFile[] = [
      f("src/components/Button.tsx"),
      f("src/auth/login.ts"),
      f("src/api/payment.ts"),
    ];
    const ranked = filterRepoFiles(files);
    expect(ranked[0]?.path).toBe("src/auth/login.ts");
    expect(ranked.some((x) => x.path === "src/api/payment.ts")).toBe(true);
  });

  it("rewards risk keywords in file content", () => {
    const files: ScannerFile[] = [
      f("src/lib/utils.ts", 500, "export const noop = () => undefined;"),
      f(
        "src/lib/legacy.ts",
        500,
        "import md5 from 'md5'; const hash = md5(password); console.log({ token })",
      ),
    ];
    const ranked = filterRepoFiles(files);
    expect(ranked[0]?.path).toBe("src/lib/legacy.ts");
  });

  it("drops files with disallowed extensions", () => {
    const files: ScannerFile[] = [
      f("public/logo.png", 5000),
      f("README.md"),
      f("src/api/users.ts"),
    ];
    const kept = filterRepoFiles(files).map((x) => x.path);
    expect(kept).not.toContain("public/logo.png");
    expect(kept).not.toContain("README.md");
    expect(kept).toContain("src/api/users.ts");
  });

  it("returns an empty array when nothing matches", () => {
    expect(filterRepoFiles([f("node_modules/foo.js")])).toEqual([]);
  });

  it("respects the maxFiles cap", () => {
    const files: ScannerFile[] = Array.from({ length: 200 }, (_, i) => f(`src/api/route-${i}.ts`));
    expect(filterRepoFiles(files, { maxFiles: 50 })).toHaveLength(50);
  });

  it("restricts to diffPaths when provided (diff mode)", () => {
    const files: ScannerFile[] = [
      f("src/auth/login.ts"),
      f("src/api/payment.ts"),
      f("src/api/users.ts"),
    ];
    const kept = filterRepoFiles(files, {
      diffPaths: new Set(["src/auth/login.ts", "src/api/users.ts"]),
    }).map((x) => x.path);
    expect(kept).toContain("src/auth/login.ts");
    expect(kept).toContain("src/api/users.ts");
    expect(kept).not.toContain("src/api/payment.ts");
  });

  it("still applies extension/ignore rules within the diff set", () => {
    const files: ScannerFile[] = [f("src/auth/login.ts"), f("docs/CHANGES.md")];
    // README/markdown is in the diff but must still be dropped by the extension rule.
    const kept = filterRepoFiles(files, {
      diffPaths: new Set(["src/auth/login.ts", "docs/CHANGES.md"]),
    }).map((x) => x.path);
    expect(kept).toEqual(["src/auth/login.ts"]);
  });

  it("returns empty when the diff set matches no scannable files", () => {
    const files: ScannerFile[] = [f("src/auth/login.ts")];
    expect(filterRepoFiles(files, { diffPaths: new Set(["other/file.ts"]) })).toEqual([]);
  });
});
