"use server";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type ConnectArgs = {
  installationId: number;
  githubRepoId: number;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
};

export async function connectRepo(args: ConnectArgs): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.from("repos").upsert(
    {
      user_id: user.id,
      installation_id: args.installationId,
      github_repo_id: args.githubRepoId,
      owner: args.owner,
      name: args.name,
      full_name: args.fullName,
      private: args.isPrivate,
      default_branch: args.defaultBranch,
    },
    { onConflict: "user_id,github_repo_id" },
  );

  if (error) {
    throw new Error(`Failed to connect repo: ${error.message}`);
  }

  redirect("/dashboard");
}
