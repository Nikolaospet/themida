// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchRepoFiles, fetchRepoTree, fetchSelectedBlobs } from "./fetcher";

const getRepoMock = vi.fn();
const getRefMock = vi.fn();
const getTreeMock = vi.fn();
const getBlobMock = vi.fn();

vi.mock("./app", () => ({
  getInstallationOctokit: async () => ({
    rest: {
      repos: { get: getRepoMock },
      git: {
        getRef: getRefMock,
        getTree: getTreeMock,
        getBlob: getBlobMock,
      },
    },
  }),
}));

const getCachedFilesMock = vi.fn();
const setCachedFilesMock = vi.fn();
vi.mock("./cache", () => ({
  getCachedFiles: (...args: unknown[]) => getCachedFilesMock(...args),
  setCachedFiles: (...args: unknown[]) => setCachedFilesMock(...args),
}));

beforeEach(() => {
  getRepoMock.mockReset();
  getRefMock.mockReset();
  getTreeMock.mockReset();
  getBlobMock.mockReset();
  getCachedFilesMock.mockReset();
  setCachedFilesMock.mockReset();
});

describe("fetchRepoTree", () => {
  it("resolves the default branch and returns blob entries", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({
      data: { object: { sha: "commit-sha-aaa" } },
    });
    getTreeMock.mockResolvedValue({
      data: {
        sha: "tree-sha-aaa",
        truncated: false,
        tree: [
          { path: "src/auth.ts", sha: "blob-1", size: 100, type: "blob" },
          { path: "src", sha: "tree-sub", size: undefined, type: "tree" },
          { path: "README.md", sha: "blob-2", size: 50, type: "blob" },
        ],
      },
    });

    const result = await fetchRepoTree(123, "owner", "repo");

    expect(result.treeSha).toBe("commit-sha-aaa");
    expect(result.files).toEqual([
      { path: "src/auth.ts", sha: "blob-1", size: 100 },
      { path: "README.md", sha: "blob-2", size: 50 },
    ]);
    expect(getRepoMock).toHaveBeenCalledWith({ owner: "owner", repo: "repo" });
    expect(getRefMock).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      ref: "heads/main",
    });
    expect(getTreeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "owner",
        repo: "repo",
        tree_sha: "commit-sha-aaa",
        recursive: "true",
      }),
    );
  });

  it("uses the explicit ref when provided", async () => {
    getRefMock.mockResolvedValue({ data: { object: { sha: "commit-sha-bbb" } } });
    getTreeMock.mockResolvedValue({
      data: { sha: "tree-bbb", truncated: false, tree: [] },
    });

    await fetchRepoTree(123, "owner", "repo", "feature/x");

    expect(getRepoMock).not.toHaveBeenCalled();
    expect(getRefMock).toHaveBeenCalledWith({
      owner: "owner",
      repo: "repo",
      ref: "heads/feature/x",
    });
  });

  it("rejects truncated trees (defer to tarball strategy)", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({ data: { object: { sha: "c" } } });
    getTreeMock.mockResolvedValue({
      data: { sha: "t", truncated: true, tree: [] },
    });
    await expect(fetchRepoTree(123, "owner", "repo")).rejects.toThrow(/truncated/);
  });

  it("rejects trees with too many files for Trees API strategy", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({ data: { object: { sha: "c" } } });
    const tooManyBlobs = Array.from({ length: 5001 }, (_, i) => ({
      path: `f-${i}.ts`,
      sha: `b-${i}`,
      size: 10,
      type: "blob",
    }));
    getTreeMock.mockResolvedValue({
      data: { sha: "t", truncated: false, tree: tooManyBlobs },
    });
    await expect(fetchRepoTree(123, "owner", "repo")).rejects.toThrow(/5000/);
  });
});

describe("fetchSelectedBlobs", () => {
  it("returns one FileContent per requested entry", async () => {
    getBlobMock.mockImplementation(async ({ file_sha }: { file_sha: string }) => ({
      data: {
        content: Buffer.from(`hello-${file_sha}`).toString("base64"),
        encoding: "base64",
      },
    }));

    const entries = [
      { path: "a.ts", sha: "sha-a", size: 7 },
      { path: "b.ts", sha: "sha-b", size: 7 },
    ];
    const out = await fetchSelectedBlobs(123, "owner", "repo", entries);

    expect(out).toHaveLength(2);
    expect(out[0]?.path).toBe("a.ts");
    expect(out[0]?.content).toBe("hello-sha-a");
    expect(out[1]?.path).toBe("b.ts");
    expect(out[1]?.content).toBe("hello-sha-b");
  });

  it("returns an empty list when given no entries", async () => {
    const out = await fetchSelectedBlobs(123, "owner", "repo", []);
    expect(out).toEqual([]);
    expect(getBlobMock).not.toHaveBeenCalled();
  });

  it("respects the concurrency cap (chunked fetches)", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    getBlobMock.mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return {
        data: { content: Buffer.from("x").toString("base64"), encoding: "base64" },
      };
    });

    const entries = Array.from({ length: 25 }, (_, i) => ({
      path: `f-${i}.ts`,
      sha: `s-${i}`,
      size: 1,
    }));

    await fetchSelectedBlobs(123, "owner", "repo", entries, { concurrency: 5 });

    expect(maxInFlight).toBeLessThanOrEqual(5);
  });

  it("skips entries with non-base64 encodings", async () => {
    getBlobMock.mockImplementation(async () => ({
      data: { content: "ignored", encoding: "utf-8" as const },
    }));

    const out = await fetchSelectedBlobs(123, "owner", "repo", [
      { path: "weird.bin", sha: "s", size: 4 },
    ]);
    expect(out).toEqual([]);
  });
});

describe("fetchRepoFiles", () => {
  it("fetches all selected entries when nothing is cached", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({ data: { object: { sha: "c1" } } });
    getTreeMock.mockResolvedValue({
      data: {
        sha: "t1",
        truncated: false,
        tree: [
          { path: "src/a.ts", sha: "sha-a", size: 5, type: "blob" },
          { path: "src/b.ts", sha: "sha-b", size: 5, type: "blob" },
        ],
      },
    });
    getBlobMock.mockImplementation(async ({ file_sha }: { file_sha: string }) => ({
      data: {
        content: Buffer.from(`c-${file_sha}`).toString("base64"),
        encoding: "base64",
      },
    }));
    getCachedFilesMock.mockResolvedValue(new Map());

    const r = await fetchRepoFiles(123, "owner", "repo", {
      paths: ["src/a.ts", "src/b.ts"],
      cacheRepoId: "repo-uuid-1",
    });

    expect(r.files.map((f) => f.path).sort()).toEqual(["src/a.ts", "src/b.ts"]);
    expect(r.stats.fetched).toBe(2);
    expect(r.stats.cached).toBe(0);
    expect(setCachedFilesMock).toHaveBeenCalledWith("repo-uuid-1", expect.any(Array));
  });

  it("skips fetch for cached blobs", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({ data: { object: { sha: "c1" } } });
    getTreeMock.mockResolvedValue({
      data: {
        sha: "t1",
        truncated: false,
        tree: [
          { path: "a.ts", sha: "sha-a", size: 5, type: "blob" },
          { path: "b.ts", sha: "sha-b", size: 5, type: "blob" },
        ],
      },
    });
    getBlobMock.mockImplementation(async ({ file_sha }: { file_sha: string }) => ({
      data: {
        content: Buffer.from(`fresh-${file_sha}`).toString("base64"),
        encoding: "base64",
      },
    }));
    getCachedFilesMock.mockResolvedValue(new Map([["sha-a", "cached-a-content"]]));

    const r = await fetchRepoFiles(123, "owner", "repo", {
      paths: ["a.ts", "b.ts"],
      cacheRepoId: "repo-uuid-1",
    });

    expect(r.stats.cached).toBe(1);
    expect(r.stats.fetched).toBe(1);
    expect(getBlobMock).toHaveBeenCalledTimes(1);
    expect(getBlobMock).toHaveBeenCalledWith(expect.objectContaining({ file_sha: "sha-b" }));

    const a = r.files.find((f) => f.path === "a.ts");
    const b = r.files.find((f) => f.path === "b.ts");
    expect(a?.content).toBe("cached-a-content");
    expect(b?.content).toBe("fresh-sha-b");
  });

  it("fetches every tree entry when no paths are specified", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({ data: { object: { sha: "c1" } } });
    getTreeMock.mockResolvedValue({
      data: {
        sha: "t1",
        truncated: false,
        tree: [
          { path: "a.ts", sha: "sha-a", size: 5, type: "blob" },
          { path: "b.ts", sha: "sha-b", size: 5, type: "blob" },
        ],
      },
    });
    getBlobMock.mockImplementation(async () => ({
      data: { content: Buffer.from("x").toString("base64"), encoding: "base64" },
    }));
    getCachedFilesMock.mockResolvedValue(new Map());

    const r = await fetchRepoFiles(123, "owner", "repo");
    expect(r.files).toHaveLength(2);
    expect(r.stats.treeFiles).toBe(2);
  });

  it("does not call the cache layer when cacheRepoId is omitted", async () => {
    getRepoMock.mockResolvedValue({ data: { default_branch: "main" } });
    getRefMock.mockResolvedValue({ data: { object: { sha: "c1" } } });
    getTreeMock.mockResolvedValue({
      data: { sha: "t1", truncated: false, tree: [] },
    });

    await fetchRepoFiles(123, "owner", "repo");
    expect(getCachedFilesMock).not.toHaveBeenCalled();
    expect(setCachedFilesMock).not.toHaveBeenCalled();
  });
});
