import { notFound, redirect } from "next/navigation";

import { listAccessibleRepos } from "@/lib/github/installations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { connectRepo } from "./actions";

type Props = {
  params: Promise<{ installationId: string }>;
};

export default async function RepoPickerPage({ params }: Props) {
  const { installationId: installationIdRaw } = await params;
  const installationId = Number(installationIdRaw);
  if (!Number.isInteger(installationId) || installationId <= 0) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: installation } = await supabase
    .from("github_installations")
    .select("installation_id, account_login, account_type")
    .eq("user_id", user.id)
    .eq("installation_id", installationId)
    .maybeSingle();

  if (!installation) {
    notFound();
  }

  const repos = await listAccessibleRepos(installationId);

  if (repos.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold">No repositories available</h1>
        <p className="text-neutral-400">
          The Themida App has no repository access on{" "}
          <span className="text-neutral-200">{installation.account_login}</span> yet. Pick at least
          one repository in GitHub to continue.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold">Pick a repository</h1>
        <p className="mt-2 text-neutral-400">
          Themida has access to {repos.length} {repos.length === 1 ? "repository" : "repositories"}{" "}
          on <span className="text-neutral-200">{installation.account_login}</span>. Select one to
          start scanning.
        </p>
      </div>

      <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
        {repos.map((repo) => (
          <li key={repo.id} className="flex items-center justify-between p-4">
            <div>
              <p className="text-sm font-medium text-neutral-100">{repo.fullName}</p>
              <p className="text-xs text-neutral-500">
                {repo.private ? "Private" : "Public"} · default branch{" "}
                <span className="text-neutral-300">{repo.defaultBranch}</span>
              </p>
            </div>
            <form
              action={async () => {
                "use server";
                await connectRepo({
                  installationId,
                  githubRepoId: repo.id,
                  owner: repo.owner,
                  name: repo.name,
                  fullName: repo.fullName,
                  isPrivate: repo.private,
                  defaultBranch: repo.defaultBranch,
                });
              }}
            >
              <button
                type="submit"
                className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-neutral-900 transition hover:bg-neutral-100"
              >
                Connect
              </button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
