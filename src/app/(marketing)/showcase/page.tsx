import Link from "next/link";

import { ComplianceScore } from "@/components/dashboard/ComplianceScore";
import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { listSamples } from "@/lib/sample/data";

export default function ShowcasePage() {
  const samples = listSamples();

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs tracking-wider text-neutral-500 uppercase">Showcase</p>
        <h1 className="mt-1 text-4xl font-semibold tracking-tight">
          Real codebases, real findings.
        </h1>
        <p className="mt-3 max-w-2xl text-neutral-400">
          These reports are produced by Themida against public repositories. No edits, no
          cherry-picking. Click through to see exact file, line, legal article, and code-level fix
          for each finding.
        </p>
      </header>

      <ul className="grid gap-6 sm:grid-cols-2">
        {samples.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/sample/${s.slug}`}
              className="group flex h-full flex-col gap-6 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 transition hover:border-neutral-700"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold text-neutral-100">
                    {s.repoFullName}
                  </p>
                  <p className="mt-1 text-sm text-neutral-400">{s.blurb}</p>
                </div>
                <ComplianceScore score={s.scan.compliance_score ?? 0} size="sm" />
              </div>

              <div className="flex flex-wrap gap-2">
                <SeverityBadge severity="CRITICAL" variant="count" count={s.scan.critical_count} />
                <SeverityBadge severity="HIGH" variant="count" count={s.scan.high_count} />
                <SeverityBadge severity="MEDIUM" variant="count" count={s.scan.medium_count} />
                <SeverityBadge severity="LOW" variant="count" count={s.scan.low_count} />
              </div>

              <p className="mt-auto text-sm font-medium text-neutral-300 group-hover:text-neutral-100">
                View report →
              </p>
            </Link>
          </li>
        ))}
      </ul>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
        <h2 className="text-lg font-semibold">Scan your own repo</h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-400">
          Connect a GitHub repository and get a full GDPR audit in 60 seconds — every issue with
          exact file:line and a working fix.
        </p>
        <Link
          href="/login"
          className="mt-4 inline-flex rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
        >
          Sign in with GitHub →
        </Link>
      </section>
    </div>
  );
}
