// Server-only by transitive dependency: every code path here goes through
// serverEnv (via getInstallationOctokit / createSupabaseAdminClient), which
// throws on import from a client bundle. We omit the explicit `server-only`
// marker so this module remains importable from CLI scripts (`pnpm dev:fetch`).
import { getInstallationOctokit } from "./app";
import { getCachedFiles, setCachedFiles } from "./cache";
import type { FetchedFiles, FileContent, TreeEntry } from "./types";

const MAX_FILES_TREES_API = 5000;

export type FetchTreeResult = {
  /** Commit SHA the tree belongs to. */
  treeSha: string;
  files: TreeEntry[];
};

/**
 * Enumerates every blob in a repo via the Trees API (one HTTP call).
 * Throws if GitHub returns `truncated: true` (>100K entries) or if the
 * blob count exceeds our Trees-API budget. Phase 3c ships the tarball
 * fallback for those cases.
 */
export async function fetchRepoTree(
  installationId: number,
  owner: string,
  repo: string,
  ref?: string,
): Promise<FetchTreeResult> {
  const octokit = await getInstallationOctokit(installationId);

  const branchRef = ref ?? (await getDefaultBranch(octokit, owner, repo));
  const refResponse = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${branchRef}`,
  });
  const commitSha = refResponse.data.object.sha;

  const treeResponse = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: commitSha,
    recursive: "true",
  });
  if (treeResponse.data.truncated) {
    throw new Error(
      `Repo ${owner}/${repo} tree is truncated (>100K entries). Tarball fallback ships in Phase 3c.`,
    );
  }

  const blobs: TreeEntry[] = [];
  for (const entry of treeResponse.data.tree) {
    if (entry.type !== "blob") continue;
    if (!entry.path || !entry.sha || typeof entry.size !== "number") continue;
    blobs.push({ path: entry.path, sha: entry.sha, size: entry.size });
  }

  if (blobs.length > MAX_FILES_TREES_API) {
    throw new Error(
      `Repo ${owner}/${repo} has ${blobs.length} files (limit ${MAX_FILES_TREES_API}). Tarball fallback ships in Phase 3c.`,
    );
  }

  return { treeSha: commitSha, files: blobs };
}

async function getDefaultBranch(
  octokit: Awaited<ReturnType<typeof getInstallationOctokit>>,
  owner: string,
  repo: string,
): Promise<string> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data.default_branch;
}

export type FetchBlobsOptions = {
  concurrency?: number;
};

const DEFAULT_CONCURRENCY = 30;

/**
 * Fetches the raw bytes of every entry, in concurrency-limited batches.
 * Drops blobs whose encoding is not base64 (GitHub returns non-base64
 * for binary or oversized files).
 */
export async function fetchSelectedBlobs(
  installationId: number,
  owner: string,
  repo: string,
  entries: readonly TreeEntry[],
  options: FetchBlobsOptions = {},
): Promise<FileContent[]> {
  if (entries.length === 0) return [];

  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;
  const octokit = await getInstallationOctokit(installationId);
  const out: FileContent[] = [];

  for (let i = 0; i < entries.length; i += concurrency) {
    const chunk = entries.slice(i, i + concurrency);
    const results = await Promise.all(
      chunk.map(async (entry) => {
        const { data } = await octokit.rest.git.getBlob({
          owner,
          repo,
          file_sha: entry.sha,
        });
        if (data.encoding !== "base64") return null;
        const content = Buffer.from(data.content, "base64").toString("utf8");
        return {
          path: entry.path,
          sha: entry.sha,
          size: entry.size,
          content,
        };
      }),
    );
    for (const r of results) {
      if (r) out.push(r);
    }
  }

  return out;
}

export type FetchRepoFilesOptions = {
  ref?: string;
  /** Restrict the fetch to a subset of paths from the tree. */
  paths?: readonly string[];
  /** Pass a `repos.id` to enable SHA-keyed caching across scans. */
  cacheRepoId?: string;
  concurrency?: number;
};

/**
 * Fetches the contents of (filtered) repo files, hitting the cache first
 * and persisting fresh blobs back. The returned files preserve the order
 * of `paths` (or the tree order if `paths` is omitted).
 */
export async function fetchRepoFiles(
  installationId: number,
  owner: string,
  repo: string,
  options: FetchRepoFilesOptions = {},
): Promise<FetchedFiles> {
  const startedAt = Date.now();
  const { treeSha, files: treeFiles } = await fetchRepoTree(
    installationId,
    owner,
    repo,
    options.ref,
  );

  const wantedPaths = options.paths;
  const wantedSet = wantedPaths ? new Set(wantedPaths) : null;
  const selected = wantedSet ? treeFiles.filter((f) => wantedSet.has(f.path)) : treeFiles;

  const cached = options.cacheRepoId
    ? await getCachedFiles(
        options.cacheRepoId,
        selected.map((f) => f.sha),
      )
    : new Map<string, string>();

  const toFetch = selected.filter((f) => !cached.has(f.sha));
  const fresh = await fetchSelectedBlobs(installationId, owner, repo, toFetch, {
    concurrency: options.concurrency ?? DEFAULT_CONCURRENCY,
  });

  if (options.cacheRepoId && fresh.length > 0) {
    await setCachedFiles(options.cacheRepoId, fresh);
  }

  const freshByPath = new Map(fresh.map((f) => [f.path, f]));
  const files: FileContent[] = [];
  for (const entry of selected) {
    const cachedContent = cached.get(entry.sha);
    if (cachedContent !== undefined) {
      files.push({
        path: entry.path,
        sha: entry.sha,
        size: entry.size,
        content: cachedContent,
      });
      continue;
    }
    const freshFile = freshByPath.get(entry.path);
    if (freshFile) {
      files.push(freshFile);
    }
  }

  return {
    treeSha,
    files,
    stats: {
      treeSha,
      treeFiles: treeFiles.length,
      fetched: fresh.length,
      cached: selected.length - fresh.length,
      totalBytes: files.reduce((acc, f) => acc + Buffer.byteLength(f.content, "utf8"), 0),
      durationMs: Date.now() - startedAt,
    },
  };
}
