// Server-only by transitive dependency on serverEnv. Omitting the explicit
// `server-only` marker keeps this module importable from CLI scripts.
import { createClient } from "@supabase/supabase-js";

import { clientEnv } from "@/env";
import { serverEnv } from "@/env";
import type { Database } from "@/types/database";

// Service-role client — bypasses RLS. Use ONLY in trusted server contexts:
// route handlers, server actions, and Trigger.dev jobs. Never import this
// from a client component or pass instances to the client.
export function createSupabaseAdminClient() {
  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
