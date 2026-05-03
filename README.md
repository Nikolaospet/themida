# Themida

Developer-first compliance intelligence platform.
Connect a GitHub repo, get a full GDPR / HIPAA / SOC 2 / ISO 27001 / OWASP /
PCI DSS / EU AI Act audit report — exact file, exact line, exact fix.

> Status: **Phase 0 — foundations**. Not production-ready.

See [`PRD.md`](./PRD.md) for the full product spec and
[`CLAUDE.md`](./CLAUDE.md) for the engineering blueprint.
Architectural decisions live in [`docs/adr/`](./docs/adr/).

## Stack

- Next.js 16 (App Router, RSC) + React 19
- TypeScript 5 (strict + `noUncheckedIndexedAccess`)
- Tailwind CSS v4
- Zod 4 (runtime validation)
- Supabase (Postgres + Auth + Storage + Realtime)
- Trigger.dev v3 (background jobs) — _planned_
- Anthropic Claude (`sonnet-4-6` + `haiku-4-5`) — _planned_
- Vitest + Testing Library
- Vercel hosting

## Requirements

- Node.js ≥ 22
- pnpm ≥ 10

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env.local
# fill in the required values

# 3. Boot the local Supabase stack (Postgres + Auth + Studio)
pnpm db:start

# 4. Apply migrations
pnpm db:reset

# 5. Run the dev server
pnpm dev
```

Open <http://localhost:3000>. Supabase Studio runs at <http://127.0.0.1:54323>.

> **Requirements for the local stack:** Docker Desktop must be running.
> The Supabase CLI provisions Postgres, GoTrue, Studio, etc., as containers.

> **Connecting a repository** requires a registered GitHub App. Follow
> [`docs/setup/github-app.md`](./docs/setup/github-app.md) once and
> drop the resulting credentials into your `.env.local`.

## Scripts

| Command             | Purpose                                |
| ------------------- | -------------------------------------- |
| `pnpm dev`          | Run the Next.js dev server             |
| `pnpm build`        | Production build                       |
| `pnpm start`        | Serve the production build             |
| `pnpm lint`         | Run ESLint                             |
| `pnpm lint:fix`     | Run ESLint with `--fix`                |
| `pnpm typecheck`    | Run `tsc --noEmit`                     |
| `pnpm format`       | Format the codebase with Prettier      |
| `pnpm format:check` | Check formatting without writing       |
| `pnpm secretlint`   | Scan for secrets locally               |
| `pnpm test`         | Run unit tests once                    |
| `pnpm test:watch`   | Run unit tests in watch mode           |
| `pnpm db:start`     | Boot local Supabase stack              |
| `pnpm db:stop`      | Stop local Supabase stack              |
| `pnpm db:reset`     | Drop + recreate local DB and re-apply migrations |
| `pnpm db:types`     | Regenerate `src/types/database.ts` from local DB |

## Project structure

```
themida/
├── src/
│   ├── app/                Next.js App Router routes (auth, dashboard, marketing)
│   ├── lib/                Utilities, Supabase + crypto + scanner clients
│   ├── types/              Generated DB types
│   ├── env.ts              Zod-validated env vars (lazy)
│   └── middleware.ts       Supabase session refresh
├── supabase/
│   ├── config.toml         Local stack config
│   └── migrations/         SQL migrations (versioned)
├── public/                 Static assets
├── docs/adr/               Architecture decision records
├── .github/workflows/      CI: ci, codeql, gitleaks
└── .husky/                 git hooks
```

## Quality gates

- **Pre-commit:** `lint-staged` runs ESLint, Prettier and `secretlint` on
  staged files.
- **commit-msg:** `commitlint` enforces
  [Conventional Commits](https://www.conventionalcommits.org/).
- **Pre-push:** `tsc --noEmit` + `vitest run`.
- **CI:** lint + typecheck + secretlint + test + build on every PR.
- **Security:** CodeQL + gitleaks on every PR and weekly.
- **Dependencies:** Dependabot grouped weekly updates.

## Observability

- **Logger:** Pino — server-side structured JSON logs. Pretty output in
  development, plain JSON in test and production. Sensitive fields
  (`password`, `token`, `apiKey`, `authorization`) are auto-redacted.
  Use `import { childLogger } from "@/lib/logger"` to attach correlation
  IDs (`scanId`, `userId`, `requestId`).
- **Errors / traces:** Sentry (EU instance) via `@sentry/nextjs`. Set
  `NEXT_PUBLIC_SENTRY_DSN` to enable. Source maps are uploaded at
  build time when `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT`
  are set. Local dev keeps the SDK disabled unless
  `SENTRY_FORCE_ENABLE=1` is exported.
- **Cost tracking:** Every Anthropic call (when wired in Phase 3b)
  goes through `src/lib/observability/cost-tracker.ts`, which records
  the call in `public.claude_api_calls` with input / output / cached
  tokens and the cost in cents. Pricing is integer cents per 1M
  tokens to avoid floating-point rounding.

## Compliance rules + evals

The rules engine lives under `src/lib/rules/` (immutable
`ComplianceRule` data) and `src/lib/scanner/` (file filter +
chunker). The first 10 rules ship in this codebase: 5 GDPR rules
(`GDPR-001`–`GDPR-005`) and 5 EU AI Act rules
(`AI-ACT-001`–`AI-ACT-005`). New rules go in
`src/lib/rules/<framework>.ts` and are registered automatically via
the framework arrays.

Hand-labelled fixture repositories live under `evals/repos/<id>/`,
each shipping a `manifest.json` listing expected findings + a `code/`
tree we evaluate against. Phase 3a's eval only validates that the
file filter surfaces the files where findings are expected — actual
detection lands in Phase 3b once the Claude integration is wired.

Run the suite via `pnpm evals:run` (it is also part of `pnpm test`).

## Repo file fetcher (Phase 1.6)

`src/lib/github/fetcher.ts` enumerates a repo's files via the GitHub
**Trees API** (one HTTP call) and pulls the bytes of a chosen subset
in concurrency-limited batches via the **raw blob** endpoint. Repos
larger than 5 K files are rejected for now — the tarball fallback
ships in Phase 3c.

Each fetched blob is gzipped and written to `public.repo_file_cache`
keyed by `(repo_id, blob_sha)`. Re-scans only re-fetch blobs whose
SHA has changed; for an unchanged repo the second scan reads
exclusively from cache.

To inspect the live numbers (file count, total bytes, token estimate,
cache hit rate) on your most recently connected repo:

```bash
pnpm dev:fetch
```

The script is read-only against GitHub and writes only to
`repo_file_cache`. It uses the service-role admin client, so it runs
locally regardless of the authenticated session — but it requires that
you've completed the GitHub App install flow at least once (otherwise
no `repos` row exists for it to read).

## AI scanner (Phase 3b)

The compliance scanner uses **Gemma 4 31B Instruct** via the
**OpenRouter** gateway (`google/gemma-4-31b-it:free`). The pipeline
is the classic three-pass setup:

1. **Recon** — one LLM call, file-signature input, returns up to 15
   most-suspect paths.
2. **Deep scan** — runs in parallel chunks of ≤ 20 K tokens with a
   concurrency cap of 2; each chunk returns `RawFinding[]`.
3. **Verification** — a final pass that drops hallucinated paths and
   already-mitigated cases. Findings are batched at 30/group.

Every call is logged to `public.llm_api_calls` with `provider`,
`model`, `pass`, token usage, duration and (when a paid model is in
use) cost in cents.

### Config

```env
OPENROUTER_API_KEY=...                       # required
OPENROUTER_MODEL=google/gemma-4-31b-it:free  # default
```

### End-to-end run

```bash
pnpm dev:scan
```

Picks the most-recently-connected repo, runs the full pipeline,
prints scan stats + the top findings.

### Live eval test

```bash
LIVE_LLM=1 pnpm test evals/live-llm.test.ts
```

Spends 3 free-tier calls (recon + deep + verify) against
`evals/repos/002-md5-password-leftover/`. Passes when at least one
verified `GDPR-001` finding is returned.

### What is NOT in Phase 3b

- Trigger.dev wiring — Phase 4.
- Credit deduction + idempotency — Phase 4.
- API route + Realtime UI — Phase 5.
- Eval CI gate with false-positive thresholds — Phase 3c.
- Prompt caching — re-evaluated when we move off the free tier.

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Security

See [`SECURITY.md`](./SECURITY.md). Do **not** open public issues for
suspected vulnerabilities.

## License

Proprietary. © AlkeLabs. All rights reserved.
