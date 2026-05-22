import { getInstallationOctokit } from "./app";

/**
 * List the files changed by a pull request, for diff-scoped scans.
 *
 * Returns the set of file paths that still exist at the PR head — i.e.
 * `added`, `modified`, `renamed`, `changed`, and `copied` files. `removed`
 * files are excluded since there is nothing to scan. Paginates through the
 * GitHub API (100 per page).
 */
export async function getPullRequestFilePaths(
  installationId: number,
  owner: string,
  repo: string,
  pullNumber: number,
): Promise<Set<string>> {
  const octokit = await getInstallationOctokit(installationId);
  const paths = new Set<string>();

  const iterator = octokit.paginate.iterator(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  for await (const { data: files } of iterator) {
    for (const file of files) {
      if (file.status === "removed") continue;
      paths.add(file.filename);
    }
  }

  return paths;
}
