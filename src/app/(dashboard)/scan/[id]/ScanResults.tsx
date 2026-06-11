"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { ComplianceScore } from "@/components/dashboard/ComplianceScore";
import { IssueCard, type IssueCardData } from "@/components/dashboard/IssueCard";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { SEVERITY_TOKENS } from "@/lib/design/tokens";
import { formatFrameworkLabels } from "@/lib/rules/framework-labels";
import type { Severity } from "@/lib/rules/types";
import type { Database } from "@/types/database";

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

const SEVS: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];

interface Props {
  scan: ScanRow;
  issues: IssueCardData[];
  repoFullName: string;
  defaultBranch: string;
  /** Optional — passed through to IssueCard for stable GitHub deep-links. */
  commitSha?: string | null;
  /** Aggregated LLM usage for this scan; the metadata line is hidden when zero. */
  usage?: { tokens: number; costCents: number };
}

function formatCost(costCents: number): string {
  if (costCents <= 0) return "<$0.01";
  const dollars = costCents / 100;
  return dollars < 0.01 ? "<$0.01" : `~$${dollars.toFixed(2)}`;
}

function formatDuration(start: string | null, end: string | null): string | null {
  if (!start || !end) return null;
  const sec = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 1000);
  if (sec < 0) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
}

function parseSeverities(raw: string | null): Severity[] {
  if (!raw) return SEVS;
  const parts = raw
    .split(",")
    .map((p) => p.trim().toUpperCase())
    .filter((p): p is Severity => (SEVS as string[]).includes(p));
  return parts.length > 0 ? parts : SEVS;
}

export function ScanResults({
  scan,
  issues,
  repoFullName,
  defaultBranch,
  commitSha,
  usage,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const activeSevs = parseSeverities(params.get("severity"));
  const sortBy: "severity" | "file" = params.get("sort") === "file" ? "file" : "severity";
  const fileQuery = params.get("q") ?? "";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const toggleSev = (s: Severity) => {
    const next = activeSevs.includes(s) ? activeSevs.filter((x) => x !== s) : [...activeSevs, s];
    setParam("severity", next.length === SEVS.length ? null : next.join(","));
  };

  const counts = useMemo(() => {
    const c: Record<Severity, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const i of issues) {
      c[i.severity]++;
    }
    return c;
  }, [issues]);

  const activeSet = new Set(activeSevs);
  const activeKey = activeSevs.join(",");

  const filtered = useMemo(() => {
    const f = issues
      .filter((i) => activeSet.has(i.severity))
      .filter((i) => !fileQuery || i.file_path.toLowerCase().includes(fileQuery.toLowerCase()));
    return [...f].sort((a, b) => {
      if (sortBy === "file") {
        if (a.file_path !== b.file_path) return a.file_path.localeCompare(b.file_path);
        return (a.line_number ?? 0) - (b.line_number ?? 0);
      }
      const sw = SEVERITY_TOKENS[b.severity].weight - SEVERITY_TOKENS[a.severity].weight;
      if (sw !== 0) return sw;
      return a.file_path.localeCompare(b.file_path);
    });
    // activeSet identity changes every render; activeKey serializes activeSevs
    // for a stable memo input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues, activeKey, fileQuery, sortBy]);

  if (issues.length === 0) {
    return <EmptyCelebration repoFullName={repoFullName} frameworks={scan.frameworks ?? []} />;
  }

  const duration = formatDuration(scan.started_at, scan.completed_at);
  const frameworkLabel = formatFrameworkLabels(scan.frameworks ?? []);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <ComplianceScore score={scan.compliance_score ?? 0} />
          <div className="flex-1 space-y-3">
            <p className="text-sm text-neutral-400 tabular-nums">
              Scanned {scan.files_scanned ?? 0} files
              {duration && <> in {duration}</>}
            </p>
            {frameworkLabel.length > 0 && (
              <p className="text-sm text-neutral-500">Frameworks: {frameworkLabel}</p>
            )}
            {usage && usage.tokens > 0 && (
              <p className="text-sm text-neutral-500 tabular-nums">
                {usage.tokens.toLocaleString("en-US")} tokens · {formatCost(usage.costCents)} est.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {SEVS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSev(s)}
                  aria-pressed={activeSevs.includes(s)}
                  className={`transition ${activeSevs.includes(s) ? "opacity-100" : "opacity-40"}`}
                >
                  <SeverityBadge severity={s} variant="count" count={counts[s]} />
                </button>
              ))}
            </div>
          </div>
          <ExportLinks scanId={scan.id} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-400 tabular-nums">
          {filtered.length} {filtered.length === 1 ? "issue" : "issues"}
        </p>
        <div className="flex items-center gap-3">
          {issues.length > 20 && (
            <input
              type="search"
              placeholder="Filter by file…"
              defaultValue={fileQuery}
              onChange={(e) => setParam("q", e.target.value || null)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-neutral-500 focus:outline-none"
            />
          )}
          <label className="flex items-center gap-2 text-sm text-neutral-400">
            Sort:
            <select
              value={sortBy}
              onChange={(e) => setParam("sort", e.target.value === "file" ? "file" : null)}
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm text-neutral-100"
            >
              <option value="severity">By severity</option>
              <option value="file">By file</option>
            </select>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            repoFullName={repoFullName}
            defaultBranch={defaultBranch}
            {...(commitSha !== undefined ? { commitSha } : {})}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-400">
          No issues match your filters. Try widening the severity selection.
        </p>
      )}
    </div>
  );
}

function ExportLinks({ scanId }: { scanId: string }) {
  const linkClass =
    "inline-flex items-center gap-1 rounded-lg border border-neutral-700 px-3 py-1.5 text-sm text-neutral-200 transition hover:border-neutral-500 hover:text-neutral-50";
  return (
    <div className="flex flex-row gap-2 sm:flex-col sm:self-start">
      <a href={`/api/scan/${scanId}/sarif`} download className={linkClass}>
        Download SARIF
      </a>
      <a href={`/api/scan/${scanId}/pdf`} download className={linkClass}>
        Download PDF
      </a>
    </div>
  );
}

function EmptyCelebration({
  repoFullName,
  frameworks,
}: {
  repoFullName: string;
  frameworks: readonly string[];
}) {
  const frameworkLabel = formatFrameworkLabels(frameworks);

  return (
    <div className="rounded-2xl border border-emerald-900/40 bg-emerald-950/20 p-12 text-center">
      <p className="text-6xl" aria-hidden>
        🎉
      </p>
      <h2 className="mt-6 text-2xl font-semibold text-emerald-100">No compliance issues found.</h2>
      <p className="mt-2 text-sm text-emerald-300/80">
        {repoFullName} scored 100 — you&apos;re in the top 5% of repos we&apos;ve scanned.
      </p>
      {frameworkLabel.length > 0 && (
        <p className="mt-2 text-xs text-emerald-400/70">Checked: {frameworkLabel}</p>
      )}
    </div>
  );
}
