import type { RawFinding } from "./findings";

// Findings whose `file_path` points at generated, vendored, or built output are
// noise: users cannot act on them and they dilute trust in real findings. We
// drop them deterministically before they reach the report. Patterns match a
// path *segment* (anchored at start or after a "/") so substrings like
// "distance" or "build-utils" in a real source path are not flagged.
const GENERATED_PATH_PATTERNS: readonly RegExp[] = [
  /(^|\/)node_modules\//u,
  /(^|\/)dist\//u,
  /(^|\/)\.next\//u,
  /(^|\/)build\//u,
  /(^|\/)coverage\//u,
  /(^|\/)out\//u,
  /(^|\/)\.turbo\//u,
  /\.min\.(js|css)$/u,
];

export function isGeneratedPath(filePath: string): boolean {
  return GENERATED_PATH_PATTERNS.some((p) => p.test(filePath));
}

export type GeneratedPathPartition = {
  readonly kept: RawFinding[];
  readonly dropped: RawFinding[];
};

export function dropGeneratedPathFindings(findings: readonly RawFinding[]): GeneratedPathPartition {
  const kept: RawFinding[] = [];
  const dropped: RawFinding[] = [];
  for (const finding of findings) {
    (isGeneratedPath(finding.file_path) ? dropped : kept).push(finding);
  }
  return { kept, dropped };
}
