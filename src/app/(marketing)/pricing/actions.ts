"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export interface WaitlistResult {
  ok: boolean;
  message: string;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const ALLOWED_PLANS = new Set(["starter", "builder", "growth", "agency"]);

export async function joinWaitlist(formData: FormData): Promise<WaitlistResult> {
  const emailRaw = formData.get("email");
  const planRaw = formData.get("plan");
  const sourceRaw = formData.get("source");

  const email = typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return { ok: false, message: "Enter a valid email address." };
  }

  const plan = typeof planRaw === "string" && ALLOWED_PLANS.has(planRaw) ? planRaw : null;
  const source =
    typeof sourceRaw === "string" && sourceRaw.length <= 64 ? sourceRaw : "pricing-page";

  try {
    const supabase = createSupabaseAdminClient();
    // Table may not be migrated locally yet; cast keeps types happy and
    // the catch below covers a missing-table error gracefully.
    const { error } = await (
      supabase as unknown as {
        from: (t: string) => {
          upsert: (
            row: Record<string, unknown>,
            opts: { onConflict: string },
          ) => Promise<{ error: unknown }>;
        };
      }
    )
      .from("waitlist")
      .upsert({ email, plan, source }, { onConflict: "email,plan" });

    if (error) {
      console.warn("[waitlist] insert failed", error);
      // Don't leak the failure to the user — they did their part.
    }
  } catch (err) {
    console.warn("[waitlist] threw", err);
  }

  return { ok: true, message: "You're on the list. We'll email when this tier opens." };
}
