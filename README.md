# Themida

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)](#status)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

> **Open-source compliance scanner for your codebase.**
> Point it at a GitHub repo. Get back every GDPR / EU AI Act issue with the
> exact file, the exact line, the legal article, and the code that fixes it.

```
src/auth/login.ts:41
  CRITICAL  GDPR Art. 5(1)(f), 32(1)(a)  Password hashed with broken MD5
  Maximum fine: €20M or 4% of revenue
  Fix → bcrypt at cost 12+, or Argon2id
```

Vanta and Drata check that you have a password policy *document*. Themida
reads the code and tells you which line stores passwords with MD5.

- 🔍 **Line-level findings** — not "you have weak crypto somewhere"
- ⚖️ **Legal citation** on every issue (article + maximum fine)
- 🛠 **Suggested fix as code** — paste-ready, not prose
- 📄 **PDF export** for auditors
- 🏠 **Self-hostable** — bring your own LLM key, your code never leaves your machine

---

## Table of contents

- [Status](#status)
- [Demo](#demo)
- [Quickstart (5 min)](#quickstart-5-min)
- [Full self-host setup](#full-self-host-setup)
- [Configuration](#configuration)
- [Available scripts](#available-scripts)
- [How it works](#how-it-works)
- [Frameworks](#frameworks)
- [Adding a rule pack](#adding-a-rule-pack)
- [Project structure](#project-structure)
- [Stack](#stack)
- [Troubleshooting](#troubleshooting)
- [FAQ](#faq)
- [Contributing](#contributing)
- [Security](#security)
- [License](#license)

---

## Status

**Alpha.** GDPR (5 rules) and EU AI Act (5 rules) packs work end-to-end. The
scanner pipeline (recon → deep scan → verify) is provider-agnostic — bring
your own LLM key (Anthropic, OpenAI, OpenRouter, Groq, Together, vLLM,
llama.cpp, …). Expect rough edges — issues and PRs welcome.

Not yet recommended for production audit *submissions*. Use it to find real
issues, not to certify a clean bill.

---

## Demo

Run the app locally (see [Quickstart](#quickstart-5-min)) and open:

- `/sample/nodegoat` — OWASP NodeGoat audit with 12 real findings (no signup)
- `/showcase` — gallery of public-repo scans

Self-hosting is the full product — there is no central server to depend on
and no upstream account to create.

---

## Quickstart (5 min)

For the fastest path: run a scan locally against an LLM provider without
setting up Supabase, GitHub OAuth, or Trigger.dev.

```bash
# 1. Clone
git clone https://github.com/Nikolaospet/themida
cd themida

# 2. Install
pnpm install

# 3. Configure (only the LLM key is mandatory for the CLI path)
cp .env.example .env.local
# edit .env.local — pick a provider:
#   LLM_PROVIDER=anthropic  + ANTHROPIC_API_KEY=…
#   LLM_PROVIDER=openai     + OPENAI_API_KEY=…  (+ OPENAI_BASE_URL=… for non-OpenAI backends)

# 4. Scan a repo (CLI path)
pnpm dev:scan
```

`pnpm dev:scan` picks the most recently connected repo from your local DB and
runs the full pipeline. If you haven't connected one yet, see
[Full self-host setup](#full-self-host-setup) below to wire up the web UI.

Requires:

- **Node.js ≥ 22**, **pnpm ≥ 10**
- An **LLM API key** for one of: Anthropic, OpenAI, OpenRouter, Groq, Together,
  or any OpenAI-compatible endpoint (vLLM, llama.cpp server, Ollama, LiteLLM, …)

---

## Full self-host setup

If you want the full web UI (dashboard, real-time scan progress, PDF export,
connect-via-GitHub flow), you need:

1. **Local Supabase** (Postgres + Auth + Storage) — handled via Docker
2. **GitHub App** — for one-click repo connection (optional; you can also use
   a personal access token)
3. **Trigger.dev** account — for background scan jobs (optional; the CLI path
   above runs scans inline)

### 1. Boot the local stack

```bash
# Docker Desktop must be running for this to work
pnpm db:start         # boots Postgres + Auth + Studio in containers
pnpm db:reset         # applies migrations to a fresh DB
pnpm db:types         # regenerates src/types/database.ts from schema
```

Supabase Studio runs at <http://127.0.0.1:54323> — a web SQL editor and table
browser. Useful while debugging.

### 2. Set env vars

After `pnpm db:start`, the CLI prints `anon` and `service_role` keys for the
local instance. Copy them into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

# Pick one LLM provider
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
# or
# LLM_PROVIDER=openai
# OPENAI_API_KEY=sk-...
# OPENAI_BASE_URL=https://openrouter.ai/api/v1     # optional — defaults to OpenAI

# Required for encrypting GitHub tokens at rest. Generate with:
#   openssl rand -hex 32
TOKEN_ENCRYPTION_KEY=<64-hex-char string>
```

See [Configuration](#configuration) for the full list.

### 3. Start the dev server

```bash
pnpm dev
```

Open <http://localhost:3000>. You can now sign in (Supabase Auth handles the
session) and access the dashboard.

### 4. Optional — register a GitHub App for one-click repo install

The "Connect a repo" flow needs a GitHub App. Skip this section if you only
want to scan local folders via the CLI.

Follow [`docs/setup/github-app.md`](./docs/setup/github-app.md). At the end
you'll have:

```env
GITHUB_APP_ID=
GITHUB_APP_SLUG=
GITHUB_APP_PRIVATE_KEY=
GITHUB_APP_INSTALL_STATE_SECRET=  # openssl rand -hex 32
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### 5. Optional — Trigger.dev for background scans

Without Trigger.dev, scans run inline via the dev scripts. For the full async
UX (real-time progress in the dashboard), run the Trigger.dev dev server in a
second terminal:

```bash
pnpm trigger:dev
```

You'll need a free Trigger.dev account and `TRIGGER_SECRET_KEY` in your env.

---

## Configuration

`.env.example` documents every var. The mandatory ones depend on your setup:

| Variable | Required for | Notes |
|----------|--------------|-------|
| `LLM_PROVIDER` | Scanner | `anthropic` (default) or `openai` |
| `ANTHROPIC_API_KEY` | Scanner (`LLM_PROVIDER=anthropic`) | |
| `OPENAI_API_KEY` | Scanner (`LLM_PROVIDER=openai`) | |
| `OPENAI_BASE_URL` | Scanner (`LLM_PROVIDER=openai`) | Default OpenAI. Point at OpenRouter, Groq, vLLM, etc. |
| `OPENAI_MODEL` | Scanner (`LLM_PROVIDER=openai`) | Default `gpt-4.1-mini` |
| `OPENAI_PROVIDER_LABEL` | Optional | Label written to `llm_api_calls.provider` |
| `NEXT_PUBLIC_SUPABASE_URL` | Web UI | From `pnpm db:start` output |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web UI | From `pnpm db:start` output |
| `SUPABASE_SERVICE_ROLE_KEY` | Web UI + admin | From `pnpm db:start` output |
| `TOKEN_ENCRYPTION_KEY` | Web UI | `openssl rand -hex 32` |
| `GITHUB_APP_*` | Connect-repo flow | See [`docs/setup/github-app.md`](./docs/setup/github-app.md) |
| `TRIGGER_SECRET_KEY` | Async scans | Optional |
| `RESEND_API_KEY` | Transactional email | Optional |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking | Optional |
| `MAX_DAILY_SPEND_CENTS` | Kill switch | Default 1000 (= $10). Set 0 to block scans entirely |

---

## Available scripts

| Command | What it does |
|---------|--------------|
| `pnpm dev` | Next.js dev server (web UI) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm test` | Run unit tests once |
| `pnpm test:watch` | Watch mode |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `lint:fix` | ESLint |
| `pnpm format` / `format:check` | Prettier |
| `pnpm db:start` / `db:stop` | Local Supabase stack |
| `pnpm db:reset` | Drop + reapply migrations |
| `pnpm db:types` | Regenerate DB types |
| `pnpm dev:fetch` | Inspect file fetcher against your most recent repo |
| `pnpm dev:scan` | Run full scan pipeline against your most recent repo |
| `pnpm evals:run` | Run accuracy evals against `evals/repos/` |
| `pnpm trigger:dev` | Trigger.dev local worker |
| `pnpm secretlint` | Scan working tree for committed secrets |

---

## How it works

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Fetch   │───▶│  Filter  │───▶│  Analyse │───▶│  Verify  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
 GitHub Trees    Relevance       LLM passes      Drop hallucinations
 + blob API      scoring         (recon →        + already-mitigated
                                  deep scan)
```

1. **Fetch** — Trees API enumerates files; raw-blob API pulls only the ones
   the relevance filter flags. Blobs are gzipped into `public.repo_file_cache`
   keyed by `(repo_id, blob_sha)`. Re-scans only re-fetch what changed.
2. **Filter** — `node_modules`, lockfiles, binaries, generated files never
   leave the source. Remaining files are scored against the chosen frameworks.
3. **Analyse** — A three-pass LLM pipeline runs concurrent chunks of ≤ 20K
   tokens with a concurrency cap of 2. `recon` returns up to 15 suspect paths;
   `deep_scan` produces raw findings per chunk.
4. **Verify** — A final pass drops paths the model hallucinated and findings
   already mitigated nearby in the same file. Findings are batched 30/group.

Every LLM call is logged to `public.llm_api_calls` with provider, model, pass,
token usage, duration and (for paid models) cost in cents.

For the data flow, retention model, and threat model see
[`SECURITY.md`](./SECURITY.md).

---

## Frameworks

| Framework | Status | Rules | Source |
|-----------|--------|-------|--------|
| GDPR (EU 2016/679) | ✅ Shipped | 5 (`GDPR-001`–`GDPR-005`) | [`src/lib/rules/gdpr.ts`](./src/lib/rules/gdpr.ts) |
| EU AI Act | ✅ Shipped | 5 (`AI-ACT-001`–`AI-ACT-005`) | [`src/lib/rules/eu-ai-act.ts`](./src/lib/rules/eu-ai-act.ts) |
| HIPAA | 🟡 Open issue | – | PRs welcome |
| SOC 2 | 🟡 Open issue | – | PRs welcome |
| ISO 27001 | 🟡 Open issue | – | PRs welcome |
| OWASP Top 10 | 🟡 Open issue | – | PRs welcome |
| PCI DSS | 🟡 Open issue | – | PRs welcome |

---

## Adding a rule pack

Rule packs are plain TypeScript. Adding a framework is **one file plus
tests** — no plugin API, no codegen.

```ts
// src/lib/rules/my-framework.ts
import type { ComplianceRule } from "./types";

export const MY_FRAMEWORK_RULES: ComplianceRule[] = [
  {
    id: "MYF-001",
    framework: "my-framework",
    title: "Don't log raw passwords",
    severity: "CRITICAL",
    article: "My Framework §1.2.3",
    legalRisk: "Unbounded — depends on jurisdiction",
    description: "Logging plaintext passwords on auth failure",
    codePatterns: ["console.log(password)", "logger.info({ password })"],
    violationExamples: ["logger.info('login failed for ' + email + ' / ' + password)"],
    complianceExamples: ["logger.info('login failed for ' + email)"],
  },
  // …
];
```

Then register it in [`src/lib/rules/index.ts`](./src/lib/rules/index.ts) and
add an eval fixture under `evals/repos/<id>/` so we can measure detection
accuracy. Open a PR — we'll review and merge.

---

## Project structure

```
themida/
├── src/
│   ├── app/                 Next.js App Router routes
│   │   ├── (marketing)/     Landing, /showcase, /trust
│   │   ├── (dashboard)/     Auth-gated UI
│   │   ├── (auth)/          Login
│   │   ├── sample/[slug]/   Public sample report
│   │   └── api/             Route handlers (incl. /api/sample/[slug]/pdf)
│   ├── components/
│   │   ├── dashboard/       SeverityBadge, ComplianceScore, IssueCard
│   │   └── reports/         ReportPDF (react-pdf)
│   ├── lib/
│   │   ├── rules/           Compliance rule packs (gdpr.ts, eu-ai-act.ts)
│   │   ├── scanner/         File filter, chunker, three-pass pipeline
│   │   ├── github/          Trees + blob fetcher, file cache
│   │   ├── crypto/          AES-256-GCM token encryption
│   │   ├── llm/             Provider-agnostic facade + per-provider adapters
│   │   ├── observability/   Pino logger, cost-tracker, Sentry init
│   │   └── supabase/        Server, browser, admin clients
│   ├── trigger/             Trigger.dev jobs (runScanJob)
│   └── types/database.ts    Generated Supabase types
├── supabase/migrations/     Versioned SQL migrations
├── evals/repos/             Hand-labelled fixtures for accuracy evals
├── docs/
│   ├── adr/                 Architecture decision records
│   └── setup/github-app.md  Step-by-step GitHub App setup
└── scripts/                 Dev / migration helpers
```

---

## Stack

- **Next.js 16** (App Router + React Server Components) + **React 19**
- **TypeScript 5** strict (+ `noUncheckedIndexedAccess`)
- **Tailwind CSS v4**
- **Supabase** — Postgres + Auth + Storage + Realtime + RLS
- **Trigger.dev v3** — background scan jobs
- **Any LLM provider** for the scan passes — Anthropic, OpenAI, or any
  Chat-Completions-compatible backend (OpenRouter, Groq, Together, vLLM,
  llama.cpp server, Ollama, LiteLLM)
- **Zod 4** — runtime validation
- **Vitest** + Testing Library
- **Pino** — structured JSON logs, sensitive-field auto-redaction
- **Sentry** — optional error + perf tracking (EU region)
- **@react-pdf/renderer** — auditor-friendly PDF export

---

## Troubleshooting

**`pnpm db:start` hangs / fails.** Make sure Docker Desktop is running. The
Supabase CLI provisions Postgres, GoTrue, Studio, and Storage as containers.
Free up ports `54321–54324` if something else is bound there.

**`Cannot find module '@/lib/...'` after a fresh clone.** Run
`pnpm db:types` to regenerate `src/types/database.ts`. The DB types are
.gitignored.

**Scans return zero findings.** Common causes:
- LLM key is missing or rate-limited — check logs for `status=429`
- Repo is larger than the 5 K file cap — the tarball fallback isn't shipped yet
- File filter rejected all files as irrelevant — try lowering the threshold
  in `src/lib/scanner/filter.ts`

**`pnpm dev:scan` says "no repos".** You need at least one row in
`public.repos`. Either complete the GitHub App install flow once via the web
UI, or insert a row manually via Supabase Studio for testing.

**Husky pre-push fails with `cache.test.ts: AuthRetryableFetchError`.**
That test requires a live Supabase instance to be reachable. Run
`pnpm db:start` before pushing, or push with `--no-verify` if you've already
run tests locally.

---

## FAQ

**Does Themida send my code to a third party?**
Yes — it sends relevant files to whichever LLM provider you configure. The
provider runs under your API key, on your account, under whatever data-use
contract you've signed with them. Themida itself has no backend: no
telemetry, no analytics, no central server. The only network calls the
scanner makes are to GitHub (to fetch code, if you point it at a remote
repo) and to your chosen LLM provider.

**Why AGPL-3.0 instead of MIT?**
AGPL allows commercial use and forking. It only restricts one thing: running
a modified version as a *public network service* without sharing your
changes. This keeps Themida from being closed-source-cloned by a bigger
vendor. If AGPL is a blocker for your use case, a commercial license is
available — email <nikolaospetridhs@gmail.com>.

**Can I run this against a private repo without giving anyone a token?**
Yes — use the CLI path (`pnpm dev:scan` with a local clone) and the
scanner reads files straight off disk. The GitHub App path is for the
remote-repo workflow; if you don't need it, skip it.

**Why is the LLM doing the work and not deterministic rules?**
Pattern-matching catches the easy cases but produces enormous false-positive
rates on real codebases. The LLM passes reduce false positives by reasoning
about context (e.g. is this MD5 used for password hashing, or for a cache
key?). Pure-regex scanners exist and have their place — this one trades cost
for accuracy.

**Can I use a local LLM?**
Not yet. A `llama.cpp` / Ollama adapter is on the roadmap. The hot path is
the prompts in `src/lib/llm/prompts.ts` — if you want to try a local model,
swap the provider in `src/lib/llm/client.ts` and PR the result.

---

## Contributing

Contributions welcome — especially:

- **New rule packs** for HIPAA, SOC 2, ISO 27001, OWASP, PCI DSS
- **Eval fixtures** under `evals/repos/` so we can measure detection accuracy
- **Bug reports** with a reproducer repo (public or anonymised)
- **Local-LLM adapter** (llama.cpp, Ollama)
- **VS Code extension** that surfaces findings inline

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the workflow, coding
conventions, and DCO sign-off requirement.

By contributing, you agree your contributions are licensed under AGPL-3.0
under the project's contribution terms.

---

## Security

Found a vulnerability? Email <nikolaospetridhs@gmail.com>. We acknowledge within
one business day and we will not lawyer up at researchers acting in good
faith. Full policy: [`SECURITY.md`](./SECURITY.md).

---

## License

[**GNU AGPL v3**](./LICENSE) · © 2026 Nikolaos Petridis

In plain English:

- ✅ **Use it** — for personal, internal, or commercial purposes
- ✅ **Modify it, fork it, run it** — anywhere you want
- ✅ **Self-host as a service for your own org**
- ⚠️ **Run a modified version as a public network service?** AGPL requires
  you to publish your changes under the same license. This is the rule that
  keeps Themida from being closed-source-cloned by a bigger vendor.
- 💼 **Need a commercial license?** If AGPL's copyleft clause is a blocker
  (e.g. you want to embed Themida in a closed-source SaaS), reach out at
  <nikolaospetridhs@gmail.com>.

The full legal text is in [`LICENSE`](./LICENSE).
