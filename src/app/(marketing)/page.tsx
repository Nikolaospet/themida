import Link from "next/link";
import { redirect } from "next/navigation";

import { SeverityBadge } from "@/components/dashboard/SeverityBadge";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const FRAMEWORKS_LIVE = ["GDPR", "EU AI Act"];
const FRAMEWORKS_SOON = ["HIPAA", "SOC 2", "ISO 27001", "OWASP Top 10", "PCI DSS"];

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
            Compliance for developers
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-neutral-50 sm:text-6xl lg:text-7xl">
            GDPR fines hit €20M.
          </h1>
          <p className="mt-4 max-w-xl text-2xl tracking-tight text-neutral-300 sm:text-3xl">
            We tell you exactly which line of code triggers them.
          </p>
          <p className="mt-6 max-w-xl text-base text-neutral-400">
            Connect a GitHub repo. In 60 seconds Themida returns every compliance issue with the
            file, the line, the legal article, and the code that fixes it.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/sample/nodegoat"
              className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
            >
              See a real report →
            </Link>
            <Link
              href="/login"
              className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-medium text-neutral-100 hover:border-neutral-600"
            >
              Scan your repo
            </Link>
          </div>

          <p className="mt-5 font-mono text-xs text-neutral-500">
            No credit card. Free tier includes 5 scans.
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

      {/* HOW IT WORKS ----------------------------------------------------- */}
      <section>
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">How it works</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight">Three steps. Sixty seconds.</h2>

        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <span className="font-mono text-xs text-neutral-500">01</span>
            <h3 className="mt-2 text-lg font-semibold">Connect GitHub</h3>
            <p className="mt-2 text-sm text-neutral-400">
              One-click GitHub App install. Read-only access to the repos you pick. Nothing is
              cloned to disk.
            </p>
          </li>
          <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <span className="font-mono text-xs text-neutral-500">02</span>
            <h3 className="mt-2 text-lg font-semibold">Pick frameworks</h3>
            <p className="mt-2 text-sm text-neutral-400">
              GDPR and the EU AI Act today. HIPAA, SOC 2, ISO 27001, OWASP, and PCI DSS land in Q3.
              Combine any of the live ones in a single scan.
            </p>
          </li>
          <li className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <span className="font-mono text-xs text-neutral-500">03</span>
            <h3 className="mt-2 text-lg font-semibold">Read the report</h3>
            <p className="mt-2 text-sm text-neutral-400">
              Each finding ships with file, line, severity, legal citation, and the exact code that
              fixes it. Export as PDF for auditors.
            </p>
          </li>
        </ol>
      </section>

      {/* FRAMEWORKS ------------------------------------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Frameworks</h2>
        <p className="mt-2 text-sm text-neutral-400">
          GDPR and the EU AI Act are live today. The rest are on the build path for Q3.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <p className="font-mono text-xs tracking-wider text-emerald-400/70 uppercase">Live</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {FRAMEWORKS_LIVE.map((f) => (
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
            <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">Coming Q3</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {FRAMEWORKS_SOON.map((f) => (
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
          Start with the public sample report on OWASP NodeGoat, or connect your own repo.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/sample/nodegoat"
            className="rounded-lg bg-white px-5 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            See the sample report →
          </Link>
          <Link
            href="/showcase"
            className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-3 text-sm font-medium text-neutral-100 hover:border-neutral-600"
          >
            Browse showcase
          </Link>
        </div>
      </section>
    </div>
  );
}
