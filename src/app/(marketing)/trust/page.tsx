import Link from "next/link";

export const metadata = {
  title: "Trust & security — Themida",
  description:
    "How Themida handles your source code, GitHub tokens, and audit data. No training on customer code. Read-only access. Server-side scans only.",
};

interface Pillar {
  label: string;
  title: string;
  body: string;
}

const PILLARS: Pillar[] = [
  {
    label: "01",
    title: "We never train on your code.",
    body: "Code we scan is sent to the LLM provider for analysis with model training disabled at the API contract level. We do not retain a copy of your source on our side beyond the duration of the scan run.",
  },
  {
    label: "02",
    title: "GitHub access is read-only.",
    body: "We use a GitHub App with the minimum permissions needed to read repository contents. We cannot push commits, open PRs, or modify settings on your behalf. Uninstall the app from your GitHub settings any time and we lose all visibility immediately.",
  },
  {
    label: "03",
    title: "Tokens are encrypted at rest.",
    body: "GitHub App installation tokens are encrypted with AES-256-GCM before being written to the database. The encryption key is stored as an application secret, not in the database. A leaked database alone cannot read tokens.",
  },
  {
    label: "04",
    title: "Scans run server-side.",
    body: "Your code never reaches another user's browser. Scan workers pull files server-to-server from GitHub, hold them only in memory during analysis, and discard them when the scan finishes.",
  },
];

interface FactRow {
  q: string;
  a: React.ReactNode;
}

const FACTS: FactRow[] = [
  {
    q: "What data do you store about my code?",
    a: (
      <>
        We store the <strong>findings</strong> a scan produces (file path, line number, severity,
        the offending snippet, suggested fix). We do not store the rest of your repository.
      </>
    ),
  },
  {
    q: "What happens if I delete my account?",
    a: (
      <>
        Scans, findings, and repository connections are deleted within 7 days. Installation tokens
        are wiped immediately on uninstall. There is no manual approval queue.
      </>
    ),
  },
  {
    q: "Who can see my reports?",
    a: (
      <>
        Only you and the GitHub organisation members you explicitly invite. Reports are private by
        default. The public showcase pages are opt-in and only available to repositories you
        explicitly publish.
      </>
    ),
  },
  {
    q: "Where is data hosted?",
    a: (
      <>
        Database and storage are hosted on Supabase (PostgreSQL with RLS, EU region). Background
        scans run on Trigger.dev. The frontend is on Vercel. We use sub-processors only — no bespoke
        server fleet.
      </>
    ),
  },
  {
    q: "Do you support self-hosted deployments?",
    a: (
      <>
        Not in the public product. If you need on-prem or VPC-only scanning, reach out and we can
        scope a custom deployment.
      </>
    ),
  },
  {
    q: "Have you been audited?",
    a: (
      <>
        Not yet. SOC 2 Type I is on our roadmap once we close paid revenue. We will not claim a
        compliance badge before we hold the report.
      </>
    ),
  },
];

interface SubRow {
  name: string;
  role: string;
  region: string;
}

const SUBPROCESSORS: SubRow[] = [
  { name: "Supabase", role: "Database, auth, file storage", region: "EU" },
  { name: "Vercel", role: "Frontend hosting", region: "Global edge" },
  { name: "Trigger.dev", role: "Background scan workers", region: "Global" },
  { name: "Anthropic", role: "LLM analysis (training disabled)", region: "US" },
  { name: "GitHub", role: "Source repository access (read-only)", region: "Global" },
  { name: "Resend", role: "Transactional email", region: "EU" },
];

export default function TrustPage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Header ----------------------------------------------------------- */}
      <header>
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
          Trust &amp; security
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          You wrote it. We just read it.
        </h1>
        <p className="mt-4 max-w-2xl text-neutral-400">
          We scan your source code to find compliance issues. That only works if you trust us with
          the read. Here is exactly how that read happens, what we store, and what we don&apos;t.
        </p>
        <p className="mt-4 font-mono text-xs text-neutral-500">Last updated 2026-05-16</p>
      </header>

      {/* Pillars ---------------------------------------------------------- */}
      <section className="grid gap-5 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <article
            key={p.label}
            className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
          >
            <p className="font-mono text-xs text-neutral-500">{p.label}</p>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">{p.title}</h2>
            <p className="mt-3 text-sm text-neutral-400">{p.body}</p>
          </article>
        ))}
      </section>

      {/* Data lifecycle --------------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
          Data lifecycle
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          What happens to your code during a scan.
        </h2>

        <ol className="mt-6 space-y-4 text-sm">
          {[
            {
              t: "1. Fetch",
              d: "Our worker streams file contents from GitHub using your OAuth token, server-to-server. Files we skip (node_modules, lockfiles, binaries) never leave GitHub.",
            },
            {
              t: "2. Filter",
              d: "We score each file for relevance to the chosen frameworks. Irrelevant files are dropped before any LLM call.",
            },
            {
              t: "3. Analyse",
              d: "Relevant files are sent to Anthropic's API with training opt-out enabled. Each request is independent — no cross-customer context.",
            },
            {
              t: "4. Persist findings",
              d: "We store the structured findings produced by the analysis (path, line, snippet, fix). The remainder of your code is discarded from worker memory.",
            },
            {
              t: "5. Expire",
              d: "Findings remain in the database until you delete the scan or the parent account. Deleted scans purge within 7 days.",
            },
          ].map((step) => (
            <li
              key={step.t}
              className="grid gap-1 border-l-2 border-neutral-700 pl-4 sm:grid-cols-[120px_1fr] sm:gap-4 sm:border-t sm:border-l-0 sm:border-neutral-800 sm:pt-4 sm:pl-0"
            >
              <p className="font-mono text-xs tracking-wider text-neutral-400 uppercase">
                {step.t}
              </p>
              <p className="text-neutral-300">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Sub-processors --------------------------------------------------- */}
      <section>
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
          Sub-processors
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          The services that touch your data.
        </h2>
        <p className="mt-3 max-w-2xl text-sm text-neutral-400">
          Themida itself runs no bespoke server fleet. Below is every third party we route data
          through. If we add or remove one, we update this page.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-neutral-800">
          <table className="w-full text-sm">
            <thead className="bg-neutral-900/60 text-left">
              <tr>
                <th className="px-4 py-3 font-mono text-xs tracking-wider text-neutral-500 uppercase">
                  Service
                </th>
                <th className="px-4 py-3 font-mono text-xs tracking-wider text-neutral-500 uppercase">
                  Role
                </th>
                <th className="px-4 py-3 font-mono text-xs tracking-wider text-neutral-500 uppercase">
                  Region
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 bg-neutral-950">
              {SUBPROCESSORS.map((s) => (
                <tr key={s.name}>
                  <td className="px-4 py-3 font-medium text-neutral-100">{s.name}</td>
                  <td className="px-4 py-3 text-neutral-300">{s.role}</td>
                  <td className="px-4 py-3 text-neutral-400">{s.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Honest facts (FAQ) ----------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
          Common questions
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">
          The things buyers ask us most.
        </h2>

        <dl className="mt-6 space-y-5 text-sm">
          {FACTS.map((f) => (
            <div key={f.q}>
              <dt className="font-semibold text-neutral-100">{f.q}</dt>
              <dd className="mt-1 text-neutral-400">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Contact ---------------------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">Found a security issue?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">
          Email{" "}
          <a className="text-neutral-200 hover:underline" href="mailto:security@themida.dev">
            security@themida.dev
          </a>
          . We acknowledge within one business day and we won&apos;t lawyer up at researchers acting
          in good faith.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/sample/nodegoat"
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-100 hover:border-neutral-600"
          >
            See a sample report →
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            View pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
