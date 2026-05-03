/* eslint-disable security/detect-non-literal-fs-filename --
   The eval runner walks a known, committed fixture directory; paths come
   from our own manifests, never from user input. */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { filterRepoFiles } from "../src/lib/scanner/filter";
import type { ScannerFile } from "../src/lib/scanner/types";
import { type Manifest, ManifestSchema } from "./manifest.schema";

const FIXTURES_DIR = path.resolve(import.meta.dirname, "repos");

export type FixtureLoadResult = {
  readonly manifest: Manifest;
  readonly files: ScannerFile[];
  readonly fixtureDir: string;
};

async function listFiles(rootDir: string): Promise<string[]> {
  const out: string[] = [];
  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(rootDir);
  return out;
}

export async function loadFixture(fixtureName: string): Promise<FixtureLoadResult> {
  const fixtureDir = path.join(FIXTURES_DIR, fixtureName);
  const manifestRaw = await readFile(path.join(fixtureDir, "manifest.json"), "utf8");
  const manifest = ManifestSchema.parse(JSON.parse(manifestRaw));

  const codeDir = path.join(fixtureDir, "code");
  const filePaths = await listFiles(codeDir);

  const files: ScannerFile[] = [];
  for (const absPath of filePaths) {
    const relative = path.relative(codeDir, absPath);
    const content = await readFile(absPath, "utf8");
    const fileStat = await stat(absPath);
    files.push({ path: relative, size: fileStat.size, content });
  }
  return { manifest, files, fixtureDir };
}

export async function listFixtures(): Promise<string[]> {
  const entries = await readdir(FIXTURES_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export type FixtureFilterReport = {
  readonly fixture: string;
  readonly fileCount: number;
  readonly filteredFiles: ReadonlyArray<{ path: string; score: number }>;
  readonly expectedPaths: readonly string[];
  readonly expectedHits: readonly string[];
  readonly expectedMisses: readonly string[];
};

/**
 * Phase 3a's eval is "did the filter even surface the files where we expect
 * findings?". Detection itself is delegated to Claude in Phase 3b.
 */
export async function runFilterEval(fixtureName: string): Promise<FixtureFilterReport> {
  const { manifest, files } = await loadFixture(fixtureName);
  const filtered = filterRepoFiles(files);
  const filteredPaths = new Set(filtered.map((f) => f.path));

  const expectedPaths = Array.from(new Set(manifest.expected_findings.map((f) => f.file_path)));
  const expectedHits = expectedPaths.filter((p) => filteredPaths.has(p));
  const expectedMisses = expectedPaths.filter((p) => !filteredPaths.has(p));

  return {
    fixture: manifest.name,
    fileCount: files.length,
    filteredFiles: filtered.map((f) => ({ path: f.path, score: f.score })),
    expectedPaths,
    expectedHits,
    expectedMisses,
  };
}

export async function runAllFilterEvals(): Promise<FixtureFilterReport[]> {
  const fixtures = await listFixtures();
  const reports: FixtureFilterReport[] = [];
  for (const fixture of fixtures) {
    reports.push(await runFilterEval(fixture));
  }
  return reports;
}
