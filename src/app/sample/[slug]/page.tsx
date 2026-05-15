import Link from "next/link";
import { notFound } from "next/navigation";

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
          <Link
            href="/login"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            Scan your own repo →
          </Link>
        </section>

        <ScanResults
          scan={sample.scan}
          issues={sample.issues}
          repoFullName={sample.repoFullName}
          defaultBranch={sample.defaultBranch}
          commitSha={sample.commitSha}
        />
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
