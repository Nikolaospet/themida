import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { startScanFromForm } from "./actions";
import { ScanErrorToast } from "./ScanErrorToast";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ scan_error?: string }>;
}

type ScanHistoryRow = {
  id: string;
  status: string;
  compliance_score: number | null;
  total_issues: number;
  created_at: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "border-neutral-700 bg-neutral-800 text-neutral-300",
  running: "border-sky-900 bg-sky-950/40 text-sky-300",
  completed: "border-emerald-900 bg-emerald-950/40 text-emerald-300",
  failed: "border-red-900 bg-red-950/40 text-red-300",
};

export default async function RepoDetailPage({ params, searchParams }: Props) {
  const { id: repoId } = await params;
  const { scan_error: scanError } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: repo } = await supabase
    .from("repos")
    .select("id, owner, name, full_name, private, default_branch")
    .eq("id", repoId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!repo) notFound();

  const { data: scans } = await supabase
    .from("scans")
    .select("id, status, compliance_score, total_issues, created_at")
    .eq("repo_id", repoId)
    .order("created_at", { ascending: false })
    .limit(10);

  const scanList: ScanHistoryRow[] = scans ?? [];
  const activeScan = scanList.find((s) => s.status === "pending" || s.status === "running");

  return (
    <div className="space-y-8">
      {scanError && <ScanErrorToast code={scanError} />}

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{repo.full_name}</h1>
          <p className="mt-2 text-sm text-neutral-400">
            {repo.private ? "Private" : "Public"} · default branch{" "}
            <span className="text-neutral-200">{repo.default_branch}</span>
          </p>
        </div>

        {activeScan ? (
          <Link
            href={`/scan/${activeScan.id}`}
            className="rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
          >
            Scan in progress — view live →
          </Link>
        ) : (
          <form action={startScanFromForm}>
            <input type="hidden" name="repoId" value={repo.id} />
            <button
              type="submit"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Run scan
            </button>
          </form>
        )}
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Scan history</h2>
        {scanList.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-950 p-8 text-center text-sm text-neutral-400">
            Run your first scan to get a compliance score for this repo.
          </div>
        ) : (
          <ScanHistoryTable scans={scanList} />
        )}
      </section>
    </div>
  );
}

function ScanHistoryTable({ scans }: { scans: ScanHistoryRow[] }) {
  return (
    <ul className="divide-y divide-neutral-800 rounded-xl border border-neutral-800 bg-neutral-900">
      {scans.map((s) => {
        const badgeClass = STATUS_BADGE[s.status] ?? STATUS_BADGE.pending;
        return (
          <li key={s.id}>
            <Link
              href={`/scan/${s.id}`}
              className="flex items-center justify-between p-4 transition hover:bg-neutral-800/50"
            >
              <div className="flex items-center gap-4">
                <span
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium ${badgeClass}`}
                >
                  {s.status}
                </span>
                <span className="text-sm text-neutral-200 tabular-nums">
                  {new Date(s.created_at).toLocaleString()}
                </span>
              </div>
              {s.status === "completed" && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-neutral-400 tabular-nums">
                    Score <span className="text-neutral-100">{s.compliance_score}</span>
                  </span>
                  <span className="text-neutral-400 tabular-nums">
                    {s.total_issues} {s.total_issues === 1 ? "issue" : "issues"}
                  </span>
                </div>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
