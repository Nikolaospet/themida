import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { serverEnv } from "@/env";
import { getInstallationDetails } from "@/lib/github/installations";
import { verifyInstallState } from "@/lib/github/state";
import { childLogger } from "@/lib/logger";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const log = childLogger({ component: "github-setup-callback" });

function redirectToError(origin: string, message: string): NextResponse {
  return NextResponse.redirect(
    new URL(`/repos/connect?error=${encodeURIComponent(message)}`, origin),
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const installationIdRaw = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");
  const state = url.searchParams.get("state");

  if (!installationIdRaw || !state) {
    return redirectToError(url.origin, "missing_parameters");
  }
  if (setupAction && setupAction !== "install" && setupAction !== "update") {
    return redirectToError(url.origin, `unexpected_setup_action_${setupAction}`);
  }

  const installationId = Number(installationIdRaw);
  if (!Number.isInteger(installationId) || installationId <= 0) {
    return redirectToError(url.origin, "invalid_installation_id");
  }

  const stateResult = verifyInstallState(state, serverEnv.GITHUB_APP_INSTALL_STATE_SECRET);
  if (!stateResult.ok) {
    log.warn({ reason: stateResult.reason }, "rejected install callback");
    return redirectToError(url.origin, `invalid_state_${stateResult.reason}`);
  }

  // Confirm the calling session matches the user the state was issued for.
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || user.id !== stateResult.userId) {
    return redirectToError(url.origin, "user_mismatch");
  }

  let details;
  try {
    details = await getInstallationDetails(installationId);
  } catch (err) {
    log.error({ err, installationId }, "failed to fetch installation details");
    return redirectToError(url.origin, "github_fetch_failed");
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("github_installations").upsert(
    {
      user_id: user.id,
      installation_id: details.installationId,
      account_id: details.accountId,
      account_login: details.accountLogin,
      account_type: details.accountType,
      suspended_at: details.suspended ? new Date().toISOString() : null,
    },
    { onConflict: "installation_id" },
  );

  if (error) {
    log.error({ err: error, installationId }, "failed to persist installation");
    return redirectToError(url.origin, "persist_failed");
  }

  return NextResponse.redirect(new URL(`/repos/${installationId}`, url.origin));
}
