"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

const POLL_INITIAL_MS = 1000;
const POLL_MAX_MS = 8000;

/**
 * Subscribe to a single scan row via Supabase realtime, with a
 * polling fallback that starts at 1s and exponential-backs-off to 8s
 * when no changes are detected.
 *
 * Notes:
 * - The realtime channel + the poller both call `onUpdate`. The
 *   poller is idempotent (it only fires when the snapshot changes).
 * - We compare via JSON.stringify because the row contains a `Json`
 *   `progress` column whose identity changes each update.
 */
export function useScanRealtime(scanId: string, onUpdate: (s: ScanRow) => void): void {
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel(`scan:${scanId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "scans", filter: `id=eq.${scanId}` },
        (payload) => onUpdate(payload.new as ScanRow),
      )
      .subscribe();

    let cancelled = false;
    let interval = POLL_INITIAL_MS;
    let lastJson = "";
    let timer: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      if (cancelled) return;
      const { data } = await supabase.from("scans").select("*").eq("id", scanId).maybeSingle();
      if (data) {
        const json = JSON.stringify(data);
        if (json !== lastJson) {
          lastJson = json;
          interval = POLL_INITIAL_MS;
          onUpdate(data as ScanRow);
        } else {
          interval = Math.min(interval * 2, POLL_MAX_MS);
        }
      }
      if (!cancelled) {
        timer = setTimeout(poll, interval);
      }
    };

    timer = setTimeout(poll, interval);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [scanId, onUpdate]);
}
