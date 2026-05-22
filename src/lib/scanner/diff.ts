import { execFileSync } from "node:child_process";

/**
 * Resolve the set of files a PR/branch touched, for diff-scoped scans.
 *
 * Two sources are supported by callers:
 *  - a local git range (`base..head` / `base...head`) via {@link localDiffPaths}
 *  - a GitHub PR number via `src/lib/github/pr-files.ts`
 *
 * The result feeds `filterRepoFiles({ diffPaths })` so only changed files are
 * scanned.
 */

export type GitRunner = (args: readonly string[]) => string;

const defaultGitRunner: GitRunner = (args) =>
  execFileSync("git", [...args], { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });

/**
 * Validate and normalize a git diff range. Accepts `base..head` or
 * `base...head`; `head` may be omitted (defaults to the working tree).
 * Rejects anything that isn't a plain two-dot/three-dot range to avoid
 * passing arbitrary strings to git.
 */
export function parseDiffRange(range: string): string {
  const trimmed = range.trim();
  const match = /^([^.\s]+(?:\.[^.\s]+)*)(\.{2,3})([^.\s]+(?:\.[^.\s]+)*)?$/u.exec(trimmed);
  if (!match) {
    throw new Error(`invalid --diff range '${range}': expected '<base>..<head>' (e.g. main..HEAD)`);
  }
  return trimmed;
}

/** Parse `git diff --name-only` output into a unique, trimmed path set. */
export function parseNameOnly(stdout: string): Set<string> {
  return new Set(
    stdout
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0),
  );
}

/**
 * Collect the paths changed in a local git range. `run` is injectable so the
 * git invocation can be stubbed in tests.
 */
export function localDiffPaths(range: string, run: GitRunner = defaultGitRunner): Set<string> {
  const validated = parseDiffRange(range);
  const stdout = run(["diff", "--name-only", validated]);
  return parseNameOnly(stdout);
}
