import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Layout already redirects unauthenticated users; user is guaranteed here.

  const { data: repos } = await supabase
    .from("repos")
    .select("id, full_name, private, default_branch, last_scanned_at, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const repoList = repos ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Your repositories</h1>
          <p className="mt-2 text-neutral-400">
            {repoList.length === 0
              ? "Connect a GitHub repository to run your first compliance scan."
              : `${repoList.length} connected ${repoList.length === 1 ? "repo" : "repos"}.`}
          </p>
        </div>
        <Link
          href="/repos/connect"
          className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-100"
        >
          Connect a repository
        </Link>
      </div>

      {repoList.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-12 text-center">
          <p className="text-sm text-neutral-400">
            Once you connect a repository, you&apos;ll be able to scan it for GDPR and EU AI Act
            compliance issues here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
          {repoList.map((repo) => (
            <li key={repo.id} className="flex items-center justify-between p-4">
              <div>
                <p className="text-sm font-medium text-neutral-100">{repo.full_name}</p>
                <p className="text-xs text-neutral-500">
                  {repo.private ? "Private" : "Public"} · default branch{" "}
                  <span className="text-neutral-300">{repo.default_branch}</span>
                  {repo.last_scanned_at ? (
                    <>
                      {" "}
                      · last scanned{" "}
                      <span className="text-neutral-300">
                        {new Date(repo.last_scanned_at).toLocaleDateString()}
                      </span>
                    </>
                  ) : (
                    <> · never scanned</>
                  )}
                </p>
              </div>
              <span className="rounded-md border border-neutral-700 px-3 py-1.5 text-xs text-neutral-400">
                Scan coming in Phase 3
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
