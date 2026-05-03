"use server";

import { redirect } from "next/navigation";

import { clientEnv } from "@/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signInWithGitHub(): Promise<void> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${clientEnv.NEXT_PUBLIC_APP_URL}/auth/callback`,
      scopes: "read:user user:email repo",
    },
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  if (data.url) {
    redirect(data.url);
  }
}
