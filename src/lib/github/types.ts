export type TreeEntry = {
  path: string;
  /** Git blob SHA (40-char hex) — content-addressed, stable across calls. */
  sha: string;
  size: number;
};

export type FileContent = TreeEntry & {
  /** UTF-8 decoded content. Binary blobs are excluded by the fetcher. */
  content: string;
};

export type FetchStats = {
  treeSha: string;
  treeFiles: number;
  /** Files we actually pulled bytes for (after the caller's filtering). */
  fetched: number;
  /** Files served from the SHA cache. */
  cached: number;
  /** Sum of fetched + cached file sizes, in bytes. */
  totalBytes: number;
  /** Wall-clock duration in ms. */
  durationMs: number;
};

export type FetchedFiles = {
  treeSha: string;
  files: FileContent[];
  stats: FetchStats;
};
