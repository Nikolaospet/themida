"use client";

import Link from "next/link";
import { useTransition } from "react";

interface Action {
  label: string;
  href: string;
}

interface ErrorMapEntry {
  title: string;
  body: string;
  action?: Action;
}

const ERROR_MAP: Record<string, ErrorMapEntry> = {
  github_auth: {
    title: "Reconnect your GitHub installation",
    body: "Themida lost access to your repo. Reinstall the app to continue.",
    action: { label: "Reconnect", href: "/repos/connect" },
  },
  timeout: {
    title: "Repo too large for the MVP",
    body: "This repo went past the 5-minute scan budget. Ping me on Twitter and I'll raise the limit for you.",
  },
  default: {
    title: "Something went wrong on our side.",
    body: "The scan didn't count toward your daily limit. Try again?",
  },
};

interface Props {
  errorCode: string | null;
  repoId: string;
  retryScan: (repoId: string) => Promise<void>;
}

export function ScanFailed({ errorCode, repoId, retryScan }: Props) {
  const [pending, startTransition] = useTransition();
  const key = errorCode && ERROR_MAP[errorCode] ? errorCode : "default";
  const e = ERROR_MAP[key] ?? ERROR_MAP.default!;

  return (
    <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-12 text-center">
      <p className="text-6xl" aria-hidden>
        ⚠️
      </p>
      <h2 className="mt-6 text-2xl font-semibold text-red-100">{e.title}</h2>
      <p className="mt-2 text-sm text-red-300/80">{e.body}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {e.action && (
          <Link
            href={e.action.href}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            {e.action.label}
          </Link>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => retryScan(repoId))}
          className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Starting…" : "Retry scan"}
        </button>
      </div>
    </div>
  );
}
