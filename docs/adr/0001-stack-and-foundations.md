# ADR 0001 — Stack and Foundations

- **Status:** Accepted
- **Date:** 2026-05-03
- **Decision makers:** Nikos (founder)

## Context

Themida is a developer-first compliance intelligence platform that scans GitHub
repositories for GDPR / HIPAA / SOC 2 / ISO 27001 / OWASP / PCI DSS / EU AI Act
violations at file + line level. The product needs to:

- Ship an MVP fast while staying maintainable and scalable.
- Handle sensitive customer code, OAuth tokens, and PII safely.
- Support async, long-running scans (60–300 s) without blocking HTTP requests.
- Integrate AI (Anthropic Claude) cost-efficiently via prompt caching.
- Reach product-market fit with a small team (founder-led for now).

## Decision

### Frontend / runtime

- **Next.js 16** (App Router, React Server Components) — server-first rendering,
  streaming, server actions, route handlers; first-class on Vercel.
- **React 19** — concurrent features, transitions, `use` hook for data.
- **TypeScript 5** with `strict`, `noUncheckedIndexedAccess`,
  `exactOptionalPropertyTypes`, `noImplicitOverride` — fail fast on type errors,
  no implicit `any`, safer index access.
- **Tailwind CSS v4 + shadcn/ui (planned)** — design system bootstrap with
  ownable, accessible primitives.
- **Zod 4** — runtime validation at every boundary (env, API inputs, AI outputs).

### Backend / data

- **Supabase** (Postgres + Auth + Realtime + Storage) — single managed dependency,
  RLS for tenant isolation from day 0, generated TypeScript types.
- **Trigger.dev v3** (planned) — durable async jobs for scans, retries, and
  observability without managing our own queue.
- **Octokit** (planned) — typed GitHub API client, supports GitHub App auth
  later (preferred over raw OAuth tokens at scale).

### AI

- **Anthropic SDK** with `claude-sonnet-4-6` for deep scans and
  `claude-haiku-4-5` for cheap reconnaissance. Prompt caching enabled on the
  static rules prompt to cut input cost by 70–90 %.

### Tooling

- **pnpm 10** — fast, strict, content-addressable store, no phantom deps.
- **ESLint 9 flat config** + `eslint-config-next` + `eslint-plugin-security`
  + `eslint-plugin-simple-import-sort`.
- **Prettier** with Tailwind plugin.
- **Husky** + **lint-staged** — pre-commit lint/format/secret-scan.
- **commitlint** with conventional commits.
- **Vitest** + **Testing Library** + **jsdom** — unit/component tests; fast,
  ESM-native, Jest-compatible API.
- **secretlint** — pre-commit JS-native secret scanning.
- **gitleaks** in CI — second-line defence on PRs and weekly scans.
- **CodeQL** in CI — dataflow security analysis with `security-extended`
  + `security-and-quality` query packs.
- **Dependabot** — weekly grouped updates for npm + GitHub Actions.

### Hosting

- **Vercel** for the Next.js app (zero-config, edge network).
- **Trigger.dev Cloud** for background jobs.

## Security defaults

- Strict CSP, HSTS preload, X-Frame-Options DENY, Permissions-Policy lockdown.
- All env vars validated by Zod at boot — fail-fast on missing/invalid keys.
- `SUPABASE_SERVICE_ROLE_KEY` server-only; never imported in client modules.
- GitHub OAuth tokens encrypted at rest with AES-256 (`TOKEN_ENCRYPTION_KEY`).
- RLS enabled on every table from migration 0001.
- `main` branch protected: required PRs, required CI checks, no force push.

## Alternatives considered

- **Drizzle ORM** instead of `supabase-js` — strong typing and migrations as code.
  Deferred until query complexity justifies the extra surface area.
- **Remix / SvelteKit** — equally capable but Vercel + RSC ergonomics on Next.js
  are better for our team and stack.
- **OpenAI** instead of Claude — Claude has a stronger code understanding track
  record, 1 M context window, and ergonomic prompt caching.
- **Self-hosted Postgres + custom auth** — too much undifferentiated work for
  Phase 1.

## Consequences

- We are tied to Supabase's roadmap for now; migration off would require porting
  RLS policies and the auth layer.
- Next.js App Router's caching and Server Actions semantics evolve; we accept
  the upgrade tax for the productivity gain.
- pnpm 10 is strict — non-standard hoisting requires explicit dependency
  declarations (a feature, not a bug).

## Deferred: GitHub-side enforcement

GitHub branch protection / rulesets and Actions on private repositories
require **GitHub Pro** (or Team for orgs). For now we accept this gap because:

- Local `pre-commit` (lint, format, secretlint) and `pre-push` (typecheck,
  vitest) hooks enforce the same checks before code leaves the laptop.
- `commitlint` enforces conventional commits at commit time.
- We're a single committer for the foreseeable future, so missing required-PR
  rules is acceptable.

Re-enable when:

- Adding a second committer, **or**
- Upgrading the account to GitHub Pro / moving to a paid org plan, **or**
- Making the repository public.

When re-enabled, the planned ruleset is: required PR, required CI status
checks (`Lint, Typecheck, Test, Build`, `CodeQL`, `Gitleaks`), no force push,
no deletion, required linear history, required conversation resolution.

## Follow-ups

- Add Drizzle once we have ≥ 5 tables with non-trivial joins.
- Introduce an MCP / Trust Center module in Phase 4.
- Add Sentry + structured logging (Pino) before public beta.
- Re-evaluate GitHub plan when CI / branch protection becomes load-bearing.
