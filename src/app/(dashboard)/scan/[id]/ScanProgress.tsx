"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { formatFrameworkLabels } from "@/lib/rules/framework-labels";
import { parseProgress, type ScanPhase } from "@/lib/scanner/progress";
import type { Database } from "@/types/database";

import { useScanRealtime } from "./useScanRealtime";

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

interface Props {
  scanId: string;
  initialScan: ScanRow;
  repoFullName: string;
}

const PHASES: { key: Exclude<ScanPhase, "queued">; label: string }[] = [
  { key: "fetching", label: "Fetch" },
  { key: "filtering", label: "Filter" },
  { key: "recon", label: "Recon" },
  { key: "deep_scan", label: "Deep scan" },
  { key: "verifying", label: "Verify" },
  { key: "done", label: "Done" },
];

function formatElapsed(startedAt: string | null): string {
  if (!startedAt) return "starting…";
  const sec = Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")} ago`;
}

export function ScanProgress({ scanId, initialScan, repoFullName }: Props) {
  const [scan, setScan] = useState<ScanRow>(initialScan);
  const [, setTick] = useState(0);
  const router = useRouter();

  useScanRealtime(scanId, (next) => {
    setScan(next);
    // If status flipped to a terminal state, ask the server page to re-render
    // into ScanResults / ScanFailed.
    if (next.status === "completed" || next.status === "failed") {
      router.refresh();
    }
  });

  // re-render every 1s so the elapsed timer ticks
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const progress = parseProgress(scan.progress);
  const phase = progress.phase;
  const currentIdx = phase === "queued" ? -1 : PHASES.findIndex((p) => p.key === phase);
  const frameworkLabel = formatFrameworkLabels(scan.frameworks ?? []);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Scanning {repoFullName}</h1>
        <p className="mt-1 text-sm text-neutral-400 tabular-nums">
          Started {formatElapsed(scan.started_at)}
        </p>
        {frameworkLabel.length > 0 && (
          <p className="mt-1 text-sm text-neutral-500">Frameworks: {frameworkLabel}</p>
        )}
      </header>

      <Stepper currentIdx={currentIdx} />

      {progress.phase === "deep_scan" && progress.filesTotal > 0 ? (
        <DeepScanProgress done={progress.filesDone} total={progress.filesTotal} />
      ) : (
        <p className="text-sm text-neutral-400">{phaseMessage(phase)}</p>
      )}
    </div>
  );
}

function phaseMessage(phase: ScanPhase): string {
  switch (phase) {
    case "queued":
      return "Waiting for worker…";
    case "fetching":
      return "Fetching repository from GitHub…";
    case "filtering":
      return "Filtering files for compliance risk…";
    case "recon":
      return "Identifying high-priority files…";
    case "deep_scan":
      return "Analyzing files…";
    case "verifying":
      return "Verifying findings…";
    case "done":
      return "Finishing up…";
  }
}

function Stepper({ currentIdx }: { currentIdx: number }) {
  return (
    <ol className="flex items-center gap-3 sm:gap-6" aria-label="Scan progress">
      {PHASES.map((p, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={p.key} className="flex flex-col items-center gap-2">
            <span
              aria-current={active ? "step" : undefined}
              className={`size-3 rounded-full transition ${
                done ? "bg-emerald-500" : active ? "animate-pulse bg-white" : "bg-neutral-700"
              }`}
            />
            <span
              className={`text-[10px] tracking-wider uppercase ${
                active ? "text-neutral-200" : "text-neutral-500"
              }`}
            >
              {p.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function DeepScanProgress({ done, total }: { done: number; total: number }) {
  const pct = Math.round((done / Math.max(total, 1)) * 100);
  return (
    <div className="space-y-2">
      <p className="text-sm text-neutral-200 tabular-nums">
        Analyzing {done} of {total} files
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-800">
        <div
          className="h-full bg-white transition-all duration-300"
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${done} of ${total} files analyzed`}
        />
      </div>
    </div>
  );
}
