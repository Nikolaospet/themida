# CI and automation

This page lists every automated check that runs on a push or pull request,
where it lives, and what makes it fail. If a check is failing on your PR,
start here.

## Workflows

All workflow files live under [`.github/workflows/`](../../.github/workflows/).

| Workflow            | Trigger                                  | Required for merge |
| ------------------- | ---------------------------------------- | ------------------ |
| `ci.yml`            | `push` to `main`, every pull request     | Yes                |
| `codeql.yml`        | `push` to `main`, every PR, weekly cron  | No                 |
| `gitleaks.yml`      | `push` to `main`, every PR, weekly cron  | No                 |
| `release-draft.yml` | Push of a `v*.*.*` tag                   | n/a                |

Only `ci.yml` is wired into the `main` branch protection's required status
checks (`Lint / Typecheck / Test / Build`). The security workflows surface
findings but do not block merges by default — fix anything they flag in a
follow-up.

## What `ci.yml` runs

In order, on `ubuntu-latest`:

1. `pnpm install --frozen-lockfile`
2. `pnpm lint` — ESLint
3. `pnpm format:check` — Prettier (no auto-fix in CI; fix locally with `pnpm format`)
4. `pnpm typecheck` — `tsc --noEmit`
5. `pnpm test` — Vitest, includes `src/**/*.test.ts(x)` and `evals/**/*.test.ts`
6. `pnpm evals:run` — runs `evals/runner.test.ts` as its own step for visibility
7. `pnpm build` — `next build` with `SKIP_ENV_VALIDATION=1`

A PR is mergeable when every step exits `0` and the conversation is resolved.

## CI vs the `pre-push` hook

`.husky/pre-push` runs `pnpm typecheck` and `pnpm test` locally before any
push. CI is a superset:

| Step            | `.husky/pre-push` | `ci.yml` |
| --------------- | ----------------- | -------- |
| Lint            | no                | yes      |
| Format check    | no                | yes      |
| Typecheck       | yes               | yes      |
| Unit + evals    | yes               | yes      |
| Evals (rerun)   | no                | yes      |
| Build           | no                | yes      |

The hook covers the cheapest catches; CI is authoritative.

## Environment variables in CI

CI runs **without secrets**. The lazy env proxies in `src/env.ts` honour
`SKIP_ENV_VALIDATION=1` and skip Zod validation so the production bundle
still compiles. Do not add a secret to GitHub Actions unless a workflow
genuinely needs it — local-only tests (the `LIVE_LLM=1` block in
`evals/live-llm.test.ts`) are deliberately not run in CI.

| Variable                | Set in CI? | Purpose                                                  |
| ----------------------- | ---------- | -------------------------------------------------------- |
| `SKIP_ENV_VALIDATION`   | yes (`1`)  | Skip env-schema validation in the build step             |
| `LIVE_LLM`              | no         | Local opt-in for paid LLM round-trip tests               |
| `NEXT_PUBLIC_SUPABASE_*`| no         | Local-only; Supabase-dependent tests mock the client     |
| `SUPABASE_SERVICE_*`    | no         | Local-only; never set in CI                              |

If you add a workflow that genuinely needs a secret, use a repository
secret and reference it as `${{ secrets.NAME }}`. Never print secrets to
logs.

## Security workflows

- **CodeQL** (`codeql.yml`) — runs the `security-extended` and
  `security-and-quality` query packs on JavaScript and TypeScript. Findings
  appear under the Security tab.
- **Gitleaks** (`gitleaks.yml`) — scans the full history for committed
  secrets. The pre-commit hook also runs `secretlint`, which is the
  authoritative gate; Gitleaks is a defence-in-depth scan on `main` and PRs.
  Allowlist false positives in [`.gitleaks.toml`](../../.gitleaks.toml).

## Release draft

Push a tag matching `v*.*.*` and `release-draft.yml` creates a GitHub
**draft** release with auto-generated notes from merged PRs since the last
tag. Nothing publishes to npm. Review the notes, fill the highlights, then
publish manually.

```bash
git tag v0.2.0
git push origin v0.2.0
```

## Adding a new check

1. Add the script to `package.json` so `pnpm <name>` works locally too.
2. Add the step to `ci.yml` between `Install dependencies` and `Build`.
3. If the check should block merges, add the new context name (the value
   of `jobs.<id>.name`) to the branch protection's required status checks.
4. Document it in the table at the top of this page.
