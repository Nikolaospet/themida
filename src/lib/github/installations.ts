// Server-only by transitive dependency on app.ts. Omitting the explicit
// marker keeps this module importable from CLI scripts.
import { getAppOctokit, getInstallationOctokit } from "./app";

export type AccessibleRepo = {
  id: number;
  owner: string;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
};

/**
 * Lists every repository the given installation grants access to.
 * Pages through the GitHub API automatically.
 */
export async function listAccessibleRepos(installationId: number): Promise<AccessibleRepo[]> {
  const octokit = await getInstallationOctokit(installationId);
  const repos: AccessibleRepo[] = [];

  for await (const { data } of octokit.paginate.iterator(
    octokit.rest.apps.listReposAccessibleToInstallation,
    { per_page: 100 },
  )) {
    for (const repo of data) {
      repos.push({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
        defaultBranch: repo.default_branch ?? "main",
      });
    }
  }

  return repos;
}

export type InstallationDetails = {
  installationId: number;
  accountLogin: string;
  accountId: number;
  accountType: "User" | "Organization";
  suspended: boolean;
};

/**
 * Fetches metadata for a single installation, used by the setup callback
 * to seed the `github_installations` row.
 */
export async function getInstallationDetails(installationId: number): Promise<InstallationDetails> {
  const app = getAppOctokit();
  const { data } = await app.rest.apps.getInstallation({ installation_id: installationId });

  const account = data.account;
  if (!account || !("login" in account)) {
    throw new Error(`installation ${installationId} has no account`);
  }
  const accountType = account.type;
  if (accountType !== "User" && accountType !== "Organization") {
    throw new Error(
      `installation ${installationId} has unsupported account type: ${String(accountType)}`,
    );
  }

  return {
    installationId,
    accountLogin: account.login,
    accountId: account.id,
    accountType,
    suspended: Boolean(data.suspended_at),
  };
}
