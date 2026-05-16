import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RepoForUser = {
  id: string;
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
};

export async function loadRepoForUser(repoId: string, userId: string): Promise<RepoForUser | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("repos")
    .select("id, owner, name, full_name, default_branch, private")
    .eq("id", repoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(`loadRepoForUser failed: ${error.message}`);
  if (!data) return null;
  return {
    id: data.id,
    owner: data.owner,
    name: data.name,
    fullName: data.full_name,
    defaultBranch: data.default_branch,
    private: data.private,
  };
}
