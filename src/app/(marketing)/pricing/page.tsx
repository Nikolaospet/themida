import Link from "next/link";

import { WaitlistForm } from "./WaitlistForm";

interface Tier {
  id: "free" | "starter" | "builder" | "growth" | "agency";
  name: string;
  price: string;
  cadence: string;
  credits: string;
  oneScan: string;
  blurb: string;
  features: string[];
  cta: "available" | "waitlist" | "primary-waitlist";
  highlight?: boolean;
}

const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "€0",
    cadence: "forever",
    credits: "5 scans / month",
    oneScan: "~1 medium repo",
    blurb: "For trying it on your own code.",
    features: [
      "GDPR + EU AI Act",
      "Up to 200 files per scan",
      "Public reports (or keep them private)",
      "PDF export",
    ],
    cta: "available",
  },
  {
    id: "starter",
    name: "Starter",
    price: "€49",
    cadence: "per month",
    credits: "20 scans / month",
    oneScan: "~4 medium repos",
    blurb: "For solo developers shipping production code.",
    features: [
      "Everything in Free",
      "Up to 1,000 files per scan",
      "Email alerts on every scan",
      "Private repos",
    ],
    cta: "waitlist",
  },
  {
    id: "builder",
    name: "Builder",
    price: "€99",
    cadence: "per month",
    credits: "60 scans / month",
    oneScan: "~12 medium repos",
    blurb: "For founders and small teams closing enterprise deals.",
    features: [
      "Everything in Starter",
      "Up to 5,000 files per scan",
      "Slack notifications",
      "All frameworks as they ship",
    ],
    cta: "primary-waitlist",
    highlight: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "€199",
    cadence: "per month",
    credits: "200 scans / month",
    oneScan: "~40 medium repos",
    blurb: "For engineering teams with regular release cadence.",
    features: [
      "Everything in Builder",
      "Unlimited file count",
      "CI integration (GitHub Actions)",
      "Priority queue",
    ],
    cta: "waitlist",
  },
  {
    id: "agency",
    name: "Agency",
    price: "€399",
    cadence: "per month",
    credits: "600 scans / month",
    oneScan: "~120 medium repos",
    blurb: "For dev agencies auditing many client codebases.",
    features: [
      "Everything in Growth",
      "Client-branded PDF reports",
      "Multi-tenant workspace",
      "SLA + dedicated Slack",
    ],
    cta: "waitlist",
  },
];

export const metadata = {
  title: "Pricing — Themida",
  description:
    "Free tier with 5 scans/month. Paid plans from €49/month launching soon — join the waitlist.",
};

export default function PricingPage() {
  return (
    <div className="space-y-16 pb-12">
      {/* Header ----------------------------------------------------------- */}
      <header className="text-center">
        <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">Pricing</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
          Pay per scan, not per seat.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
          Free tier is live today. Paid tiers open as we finish onboarding our first cohort. Drop
          your email on the plan you want and we email you the day it ships — no spam, no drip
          campaign.
        </p>
      </header>

      {/* Tier grid -------------------------------------------------------- */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
        {TIERS.map((tier) => (
          <article
            key={tier.id}
            className={`flex flex-col rounded-2xl border p-6 ${
              tier.highlight
                ? "border-emerald-700/60 bg-emerald-950/20"
                : "border-neutral-800 bg-neutral-900"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-semibold">{tier.name}</h2>
              {tier.highlight ? (
                <span className="rounded-full border border-emerald-700/60 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] tracking-wider text-emerald-200 uppercase">
                  Most popular
                </span>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-4xl font-semibold tracking-tight">{tier.price}</span>
              <span className="text-sm whitespace-nowrap text-neutral-500">{tier.cadence}</span>
            </div>

            <p className="mt-2 text-sm text-neutral-400">{tier.blurb}</p>

            <dl className="mt-4 space-y-2 rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-neutral-500">Credits</dt>
                <dd className="text-right font-medium text-neutral-200">{tier.credits}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-neutral-800 pt-2">
                <dt className="text-neutral-500">Covers</dt>
                <dd className="text-right font-medium text-neutral-200">{tier.oneScan}</dd>
              </div>
            </dl>

            <ul className="mt-4 space-y-2 text-sm text-neutral-300">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-neutral-500"
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-4">
              {tier.cta === "available" ? (
                <Link
                  href="/login"
                  className="block rounded-lg bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-100"
                >
                  Start free with GitHub →
                </Link>
              ) : (
                <WaitlistForm
                  plan={tier.id as Exclude<Tier["id"], "free">}
                  buttonLabel={
                    tier.cta === "primary-waitlist" ? "Get early access" : "Join waitlist"
                  }
                />
              )}
            </div>
          </article>
        ))}
      </section>

      {/* FAQ -------------------------------------------------------------- */}
      <section className="grid gap-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-8 lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs tracking-wider text-neutral-500 uppercase">FAQ</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">A few honest answers.</h2>
          <p className="mt-3 text-sm text-neutral-400">
            If your question isn&apos;t here, email us at{" "}
            <a className="text-neutral-200 hover:underline" href="mailto:hello@themida.dev">
              hello@themida.dev
            </a>
            .
          </p>
        </div>

        <dl className="space-y-5 text-sm">
          <div>
            <dt className="font-semibold text-neutral-100">What is a scan?</dt>
            <dd className="mt-1 text-neutral-400">
              One pass over a single repository at a specific commit, against the frameworks you
              selected. Re-scanning a repo after a fix counts as a new scan.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-100">Do you train on my code?</dt>
            <dd className="mt-1 text-neutral-400">
              No. We send file contents to the LLM provider for analysis with training disabled at
              the API contract level. Code is never persisted on our side beyond the scan run.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-100">Why is it free right now?</dt>
            <dd className="mt-1 text-neutral-400">
              We&apos;re onboarding the first cohort and tuning the rule catalog against real repos.
              Free tier stays after launch; paid tiers unlock higher limits and integrations.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-100">Refunds?</dt>
            <dd className="mt-1 text-neutral-400">
              Cancel any time from the dashboard. Unused credits roll over for one month after
              cancellation. No prorated refunds on partial months — we&apos;d rather just credit you
              back.
            </dd>
          </div>
        </dl>
      </section>

      {/* Catch-all waitlist for not-listed needs -------------------------- */}
      <section className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-900 to-neutral-950 p-8 text-center">
        <h2 className="text-2xl font-semibold tracking-tight">
          Need something we don&apos;t list?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-400">
          Self-hosted, on-prem scanning, custom frameworks, or volume contracts. Tell us your email
          and we&apos;ll reach out.
        </p>
        <div className="mx-auto mt-6 max-w-md">
          <WaitlistForm buttonLabel="Get in touch" />
        </div>
      </section>
    </div>
  );
}
