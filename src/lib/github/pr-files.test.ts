// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getPullRequestFilePaths } from "./pr-files";

const listFilesMock = vi.fn();
const iteratorMock = vi.fn();

vi.mock("./app", () => ({
  getInstallationOctokit: async () => ({
    rest: { pulls: { listFiles: listFilesMock } },
    paginate: { iterator: iteratorMock },
  }),
}));

/** Build an async iterator over the given pages, matching octokit.paginate.iterator. */
function pages(...chunks: { filename: string; status: string }[][]) {
  return {
    async *[Symbol.asyncIterator]() {
      for (const data of chunks) yield { data };
    },
  };
}

beforeEach(() => {
  listFilesMock.mockReset();
  iteratorMock.mockReset();
});

describe("getPullRequestFilePaths", () => {
  it("collects changed file paths across pages, excluding removed files", async () => {
    iteratorMock.mockReturnValue(
      pages(
        [
          { filename: "src/auth/login.ts", status: "modified" },
          { filename: "src/api/new.ts", status: "added" },
          { filename: "src/old.ts", status: "removed" },
        ],
        [
          { filename: "src/renamed.ts", status: "renamed" },
          { filename: "src/copied.ts", status: "copied" },
        ],
      ),
    );

    const paths = await getPullRequestFilePaths(42, "owner", "repo", 7);

    expect([...paths].sort()).toEqual([
      "src/api/new.ts",
      "src/auth/login.ts",
      "src/copied.ts",
      "src/renamed.ts",
    ]);
    expect(paths.has("src/old.ts")).toBe(false);
    expect(iteratorMock).toHaveBeenCalledWith(listFilesMock, {
      owner: "owner",
      repo: "repo",
      pull_number: 7,
      per_page: 100,
    });
  });

  it("returns an empty set for a PR with no scannable changes", async () => {
    iteratorMock.mockReturnValue(pages([{ filename: "gone.ts", status: "removed" }]));
    expect(await getPullRequestFilePaths(1, "o", "r", 1)).toEqual(new Set());
  });
});
