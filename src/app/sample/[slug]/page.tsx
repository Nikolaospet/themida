import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ScanResults } from "@/app/(dashboard)/scan/[id]/ScanResults";
import { getSample, listSamples } from "@/lib/sample/data";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return listSamples().map((s) => ({ slug: s.slug }));
}

export default async function SamplePage({ params }: Props) {
  const { slug } = await params;
  const sample = getSample(slug);

  if (!sample) notFound();

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* Public marketing strip — not the dashboard chrome */}
      <header className="border-b border-neutral-800 bg-neutral-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Themida
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/showcase" className="text-neutral-400 hover:text-neutral-100">
              Showcase
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-white px-3 py-1.5 font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="text-xs tracking-wider text-neutral-500 uppercase">Sample report</p>
            <h1 className="mt-1 text-3xl font-semibold">{sample.repoFullName}</h1>
            <p className="mt-2 text-sm text-neutral-400">{sample.blurb}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/sample/${sample.slug}/pdf`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 hover:border-neutral-600"
              download
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download PDF
            </a>
            <Link
              href="/login"
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              Scan your own repo →
            </Link>
          </div>
        </section>

        <Suspense fallback={<div className="text-sm text-neutral-500">Loading report…</div>}>
          <ScanResults
            scan={sample.scan}
            issues={sample.issues}
            repoFullName={sample.repoFullName}
            defaultBranch={sample.defaultBranch}
            commitSha={sample.commitSha}
          />
        </Suspense>
      </main>

      <footer className="mt-16 border-t border-neutral-800">
        <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-neutral-500">
          This is a public sample. No data was sent or stored. Connect your own repository to get a
          real audit —{" "}
          <Link href="/login" className="text-neutral-300 hover:text-neutral-100">
            sign in with GitHub
          </Link>
          .
        </div>
      </footer>
    </div>
  );
}
