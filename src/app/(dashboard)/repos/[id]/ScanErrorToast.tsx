"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

const MESSAGES: Record<string, string> = {
  daily_cap: "You've hit your daily scan limit. Try again tomorrow.",
  kill_switch: "Themida is at capacity for today. Please try again later.",
  already_running: "A scan is already running on this repo.",
  invalid_repo: "Invalid repository.",
  invalid_frameworks: "Select at least one compliance framework.",
  unknown: "Couldn't start the scan. Please try again.",
};

interface Props {
  code: string;
}

/**
 * Reads the ?scan_error param surfaced by startScanFromForm() and fires
 * a Sonner toast, then strips the param from the URL so the toast
 * doesn't re-fire on every navigation.
 */
export function ScanErrorToast({ code }: Props) {
  const router = useRouter();

  useEffect(() => {
    const msg = MESSAGES[code] ?? MESSAGES.unknown!;
    toast.error(msg);

    // Strip the query string so a refresh doesn't re-fire the toast.
    const url = new URL(window.location.href);
    url.searchParams.delete("scan_error");
    router.replace(url.pathname + (url.search || ""), { scroll: false });
  }, [code, router]);

  return null;
}
