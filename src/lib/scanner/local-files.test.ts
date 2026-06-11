// Test fixtures write to a controlled mkdtemp directory, not untrusted input.
/* eslint-disable security/detect-non-literal-fs-filename */
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { walkLocalFiles } from "./local-files";

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "themida-walk-"));
  mkdirSync(join(root, "src", "auth"), { recursive: true });
  mkdirSync(join(root, "node_modules", "foo"), { recursive: true });
  mkdirSync(join(root, ".git"), { recursive: true });

  writeFileSync(join(root, "src", "auth", "login.ts"), "export const x = 1;\n");
  writeFileSync(join(root, "README.md"), "# hello\n");
  writeFileSync(join(root, "node_modules", "foo", "index.js"), "module.exports = {};\n");
  writeFileSync(join(root, ".git", "config"), "[core]\n");
  // Binary file (contains NUL) — must be skipped.
  writeFileSync(join(root, "logo.png"), Buffer.from([0x89, 0x50, 0x00, 0x4e]));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("walkLocalFiles", () => {
  it("returns text files with POSIX-relative paths", () => {
    const paths = walkLocalFiles(root).map((f) => f.path);
    expect(paths).toContain("src/auth/login.ts");
    expect(paths).toContain("README.md");
    expect(paths.every((p) => !p.includes("\\"))).toBe(true);
  });

  it("skips dependency, VCS, and binary files", () => {
    const paths = walkLocalFiles(root).map((f) => f.path);
    expect(paths).not.toContain("node_modules/foo/index.js");
    expect(paths.some((p) => p.startsWith(".git/"))).toBe(false);
    expect(paths).not.toContain("logo.png");
  });

  it("captures content and byte size", () => {
    const login = walkLocalFiles(root).find((f) => f.path === "src/auth/login.ts");
    expect(login?.content).toBe("export const x = 1;\n");
    expect(login?.size).toBe(20);
  });

  it("does not follow symlinked directories", () => {
    let linked = false;
    try {
      symlinkSync(join(root, "src"), join(root, "link-to-src"), "dir");
      linked = true;
    } catch {
      // Symlink creation can require privileges on Windows; skip if unavailable.
    }
    if (!linked) return;
    const paths = walkLocalFiles(root).map((f) => f.path);
    expect(paths.some((p) => p.startsWith("link-to-src/"))).toBe(false);
    rmSync(join(root, "link-to-src"), { force: true });
  });
});
