import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Placeholder root. Slice 2 will replace this with the marketing
 * landing page. Until then, route logged-in users to /dashboard and
 * everyone else to /login so the app is at least navigable.
 */
export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  redirect(user ? "/dashboard" : "/login");
}
