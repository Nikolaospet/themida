import Link from "next/link";
import { redirect } from "next/navigation";

import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FRAMEWORKS_SHIPPED = ["GDPR", "EU AI Act"];
const FRAMEWORKS_OPEN = ["HIPAA", "SOC 2", "ISO 27001", "OWASP Top 10", "PCI DSS"];

const GITHUB_URL = "https://github.com/Nikolaospet/themida";

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-24 pb-12">
      {/* HERO ------------------------------------------------------------- */}
      <section className="grid gap-10 pt-6 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        <div>
          <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
            Open source · AGPL-3.0
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-50 sm:text-6xl lg:text-7xl">
            GDPR fines hit €20M.
          </h1>
          <p className="mt-4 max-w-xl text-2xl tracking-tight text-neutral-300 sm:text-3xl">
            We tell you exactly which line of code triggers them.
          </p>
          <p className="mt-6 max-w-xl text-base text-neutral-400">
            Themida is an open-source compliance scanner. Point it at a GitHub repo and it returns
            every issue with the file, the line, the legal article, and the code that fixes it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={GITHUB_URL}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 3 .1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
              </svg>
              Star on GitHub
            </Link>
            <Link
              href="/sample/nodegoat"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-medium text-neutral-100 hover:border-neutral-600"
            >
              See a real report →
            </Link>
          </div>

          <p className="mt-5 font-mono text-xs text-neutral-500">
            Self-host in 5 minutes, or use the managed version free at{" "}
            <Link href="/login" className="text-neutral-300 hover:text-neutral-100">
              sign in
            </Link>
            .
          </p>
        </div>

        {/* Hero artifact: a redacted finding card */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <SeverityBadge severity="CRITICAL" />
            <span className="font-mono text-xs text-neutral-500">app/data/user-dao.js:41</span>
          </div>

          <h3 className="mt-4 text-base font-semibold text-neutral-100">
            Password hashed with broken MD5 algorithm
          </h3>

          <pre className="mt-3 overflow-x-auto rounded-lg border border-neutral-800 bg-black/60 p-3 font-mono text-[12px] leading-relaxed text-neutral-300">
            {`var passwordHash = crypto
  .createHash(`}
            <span className="rounded bg-red-950/60 px-1 text-red-300 ring-1 ring-red-900/80">{`'md5'`}</span>
            {`)
  .update(userPassword)
  .digest('hex');`}
          </pre>
          <p className="mt-2 font-mono text-[11px] text-red-400/80">
            ← MD5 has been broken since 2004. Collisions take seconds.
          </p>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3">
              <dt className="text-neutral-500">Legal reference</dt>
              <dd className="mt-1 font-medium text-neutral-200">GDPR Art. 5(1)(f), 32(1)(a)</dd>
            </div>
            <div className="rounded-md border border-neutral-800 bg-neutral-950 p-3">
              <dt className="text-neutral-500">Maximum fine</dt>
              <dd className="mt-1 font-medium text-neutral-200">€20M or 4% revenue</dd>
            </div>
          </dl>

          <Link
            href="/sample/nodegoat"
            className="mt-4 inline-block font-mono text-xs text-neutral-400 hover:text-neutral-100"
          >
            View 11 more findings in this report →
          </Link>
        </div>
      </section>

      {/* CONTRAST --------------------------------------------------------- */}
      <section className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
            What others do
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Vanta and Drata read your policies.
          </h2>
          <p className="mt-3 text-neutral-400">
            They check that you have a password policy document. They do not check whether your
            login route stores passwords with MD5.
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-900/60 bg-emerald-950/20 p-6">
          <p className="font-mono text-xs tracking-wider text-emerald-400/70 uppercase">
            What Themida does
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-emerald-50">
            We read your code.
          </h2>
          <p className="mt-3 text-emerald-100/70">
            Every finding has a file path, a line number, a code snippet, and a working fix you can
            paste into a PR.
          </p>
        </div>
      </section>

      {/* SELF-HOST quickstart -------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
          Run it yourself
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">
          Five minutes from clone to first finding.
        </h2>
        <p className="mt-3 max-w-2xl text-neutral-400">
          The scanner is the same code in the public repo and on the hosted version. You bring your
          own LLM key, you control the API contract, you keep the findings.
        </p>

        <pre className="mt-6 overflow-x-auto rounded-lg border border-neutral-800 bg-black/60 p-4 font-mono text-xs leading-relaxed text-neutral-300">
          {`git clone https://github.com/Nikolaospet/themida
cd themida
pnpm install
export ANTHROPIC_API_KEY=sk-ant-…
pnpm themida scan ./path/to/repo`}
        </pre>

        <p className="mt-4 text-xs text-neutral-500">
          Files are sent to Anthropic under your key, with training disabled at the API contract
          level. Nothing else leaves your laptop — no telemetry, no analytics, no Themida-hosted
          backend in the loop.
        </p>

        <p className="mt-2 font-mono text-xs text-neutral-500">
          <Link href={`${GITHUB_URL}#readme`} className="text-neutral-300 hover:text-neutral-100">
            README
          </Link>{" "}
          ·{" "}
          <Link href={`${GITHUB_URL}/issues`} className="text-neutral-300 hover:text-neutral-100">
            Issues
          </Link>{" "}
          ·{" "}
          <Link
            href={`${GITHUB_URL}/blob/main/LICENSE`}
            className="text-neutral-300 hover:text-neutral-100"
          >
            AGPL-3.0
          </Link>
        </p>
      </section>

      {/* HOW IT WORKS ----------------------------------------------------- */}
      <section>
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">How it works</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Three steps. Sixty seconds.</h2>

        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <span className="font-mono text-xs text-neutral-500">01</span>
            <h3 className="mt-2 text-lg font-semibold">Point at a repo</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Hosted: one-click GitHub App, read-only. Self-hosted: a local path, or your own GitHub
              token. Nothing is stored on disk after the scan.
            </p>
          </li>
          <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <span className="font-mono text-xs text-neutral-500">02</span>
            <h3 className="mt-2 text-lg font-semibold">Pick frameworks</h3>
            <p className="mt-2 text-sm text-neutral-400">
              GDPR and the EU AI Act ship today. The rest are open issues — write a rule pack and
              we&apos;ll merge it.
            </p>
          </li>
          <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <span className="font-mono text-xs text-neutral-500">03</span>
            <h3 className="mt-2 text-lg font-semibold">Read the report</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Each finding ships with file, line, severity, legal citation, and the code that fixes
              it. Export as PDF for auditors or pipe the JSON into CI.
            </p>
          </li>
        </ol>
      </section>

      {/* FRAMEWORKS ------------------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Frameworks</h2>
        <p className="mt-2 text-sm text-neutral-400">
          Rule packs are plain TypeScript. Adding a framework is one file plus tests — see{" "}
          <Link
            href={`${GITHUB_URL}/blob/main/src/lib/rules`}
            className="text-neutral-300 hover:text-neutral-100"
          >
            src/lib/rules
          </Link>
          .
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <p className="font-mono text-xs tracking-wider text-emerald-400/70 uppercase">
              Shipped
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {FRAMEWORKS_SHIPPED.map((f) => (
                <li
                  key={f}
                  className="rounded-full border border-emerald-700/60 bg-emerald-950/30 px-3 py-1 font-mono text-xs text-emerald-100"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">
              Open issues · PRs welcome
            </p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {FRAMEWORKS_OPEN.map((f) => (
                <li
                  key={f}
                  className="rounded-full border border-neutral-700 bg-neutral-950 px-3 py-1 font-mono text-xs text-neutral-400"
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA -------------------------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-10 text-center">
        <h2 className="text-3xl font-semibold tracking-tight">
          Find out what is in your repo before your auditor does.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-neutral-400">
          Browse the public sample report on OWASP NodeGoat, clone the repo, or run the hosted
          version.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href={GITHUB_URL}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.3-3.2-.1-.3-.6-1.6.1-3.3 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 3 .1 3.3.8.8 1.3 1.9 1.3 3.2 0 4.7-2.8 5.7-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
            </svg>
            Star on GitHub
          </Link>
          <Link
            href="/sample/nodegoat"
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-medium text-neutral-100 hover:border-neutral-600"
          >
            See the sample report →
          </Link>
        </div>
      </section>
    </div>
  );
}
