import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

import type { ScannerFile } from "./types";

// Directories we never descend into: dependency trees, build output, and VCS
// metadata. The scanner filter (`filterRepoFiles`) drops most of these too, but
// skipping them here avoids reading thousands of irrelevant files off disk.
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  "out",
  "coverage",
  ".turbo",
  ".cache",
  ".themida-cache",
  ".vercel",
  "vendor",
]);

// Skip blobs larger than this. Real source files are well under 1 MB; anything
// bigger is almost always generated, minified, or a checked-in binary.
const MAX_FILE_BYTES = 1_000_000;

/**
 * Recursively walk a local directory and return its readable text files as
 * `ScannerFile`s, with POSIX-style paths relative to `root`.
 *
 * Used by the CLI path-scan mode (`pnpm dev:scan --path ./repo`) so a local
 * clone can be scanned without Supabase or a GitHub App. Binary files (detected
 * by a NUL byte) and oversized files are skipped; downstream `filterRepoFiles`
 * applies the extension/relevance filtering.
 *
 * Symlinks are not followed — `readdirSync` reports them via `lstat`, so a
 * symlinked directory is neither descended into nor read, avoiding cycles.
 */
export function walkLocalFiles(root: string): ScannerFile[] {
  const out: ScannerFile[] = [];
  walk(root, root, out);
  return out;
}

function walk(root: string, dir: string, out: ScannerFile[]): void {
  // Path is an explicit operator-supplied CLI argument, not untrusted input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      walk(root, full, out);
      continue;
    }
    if (!entry.isFile()) continue; // symlinks, sockets, fifos, etc.

    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const size = statSync(full).size;
    if (size > MAX_FILE_BYTES) continue;

    let buffer: Buffer;
    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      buffer = readFileSync(full);
    } catch {
      continue; // unreadable (permissions, race) — skip rather than fail the scan
    }
    if (buffer.includes(0)) continue; // NUL byte → binary

    const rel = relative(root, full).split(sep).join("/");
    out.push({ path: rel, size, content: buffer.toString("utf8") });
  }
}
