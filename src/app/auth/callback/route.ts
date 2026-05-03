import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { encryptToken } from "@/lib/crypto/tokens";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    const message = error?.message ?? "exchange_failed";
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, url.origin),
    );
  }

  const providerToken = data.session.provider_token;
  if (providerToken) {
    try {
      const encrypted = await encryptToken(providerToken);
      const admin = createSupabaseAdminClient();
      await admin
        .from("profiles")
        .update({ github_token_encrypted: encrypted })
        .eq("id", data.session.user.id);
    } catch (err) {
      // Encryption / DB write failure must not strand the user mid-login.
      // Log and continue — the next OAuth round-trip refreshes the token.
      console.error("[auth/callback] failed to persist provider token", err);
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
