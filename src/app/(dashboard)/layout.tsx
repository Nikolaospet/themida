import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, credits, plan")
    .eq("id", user.id)
    .maybeSingle();

  const displayName = profile?.full_name ?? user.email ?? "Account";

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">Themida</span>
            <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-400 uppercase">
              {profile?.plan ?? "free"}
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-neutral-400 sm:inline">
              <span className="font-medium text-neutral-200">{profile?.credits ?? 0}</span> credits
            </span>
            <span className="text-neutral-200">{displayName}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-neutral-700 px-3 py-1.5 text-xs text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
