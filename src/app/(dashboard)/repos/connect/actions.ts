"use server";

import { redirect } from "next/navigation";

import { serverEnv } from "@/env";
import { buildInstallUrl } from "@/lib/github/install-url";
import { signInstallState } from "@/lib/github/state";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function startInstallFlow(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const state = signInstallState(user.id, serverEnv.GITHUB_APP_INSTALL_STATE_SECRET);
  const url = buildInstallUrl({ slug: serverEnv.GITHUB_APP_SLUG, state });
  redirect(url);
}
