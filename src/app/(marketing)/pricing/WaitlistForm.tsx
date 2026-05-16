"use client";

import { useActionState } from "react";

import { joinWaitlist, type WaitlistResult } from "./actions";

interface WaitlistFormProps {
  plan?: "starter" | "builder" | "growth" | "agency";
  buttonLabel?: string;
  placeholder?: string;
}

const INITIAL: WaitlistResult = { ok: false, message: "" };

export function WaitlistForm({
  plan,
  buttonLabel = "Notify me",
  placeholder = "you@company.com",
}: WaitlistFormProps) {
  const [state, formAction, pending] = useActionState(
    async (_prev: WaitlistResult, fd: FormData) => joinWaitlist(fd),
    INITIAL,
  );

  if (state.ok) {
    return (
      <p className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-200">
        {state.message}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 sm:flex-row">
      {plan ? <input type="hidden" name="plan" value={plan} /> : null}
      <input type="hidden" name="source" value="pricing-page" />
      <label className="sr-only" htmlFor={`waitlist-email-${plan ?? "all"}`}>
        Email address
      </label>
      <input
        id={`waitlist-email-${plan ?? "all"}`}
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Joining…" : buttonLabel}
      </button>
      {state.message && !state.ok ? (
        <p className="text-sm text-red-400 sm:basis-full">{state.message}</p>
      ) : null}
    </form>
  );
}
