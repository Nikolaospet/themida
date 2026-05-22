# Scripts

Run from the repository root.

| Command | Description |
| ------- | ----------- |
| `pnpm dev` | Next.js dev server (web UI) |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm test` | Unit tests (once) |
| `pnpm test:watch` | Unit tests (watch) |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` / `pnpm lint:fix` | ESLint |
| `pnpm format` / `pnpm format:check` | Prettier |
| `pnpm db:start` / `pnpm db:stop` | Local Supabase stack |
| `pnpm db:reset` | Drop and reapply migrations |
| `pnpm db:types` | Regenerate `src/types/database.ts` |
| `pnpm dev:fetch` | Inspect file fetcher for the latest repo |
| `pnpm dev:scan` | Run full scan pipeline for the latest repo |
| `pnpm dev:scan --frameworks gdpr,mica` | Restrict the scan to selected framework packs |
| `pnpm dev:scan --diff main..HEAD` | Scan only files changed in a local git range |
| `pnpm dev:scan --github-pr 42` | Scan only files changed in a GitHub PR |
| `pnpm evals:run` | Accuracy evals under `evals/repos/` |
| `pnpm trigger:dev` | Trigger.dev local worker |
| `pnpm secretlint` | Scan working tree for committed secrets |

## Selecting frameworks for `dev:scan`

By default `pnpm dev:scan` runs every registered framework pack. Pass
`--frameworks` with a comma-separated, case-insensitive list to restrict the
scan to a subset:

```bash
pnpm dev:scan --frameworks gdpr          # GDPR only
pnpm dev:scan --frameworks gdpr,mica     # GDPR + MiCA
```

Unknown ids fail fast and exit non-zero with the list of valid ids. Valid ids
come from [`src/lib/rules/frameworks/registry.ts`](../../src/lib/rules/frameworks/registry.ts).

## Diff-scoped scans (`--diff` / `--github-pr`)

By default `pnpm dev:scan` analyses every file in the repo. For PR-time runs
that is slow and burns tokens — most reviewers only care about findings the PR
introduced. Diff mode restricts the scan to the files a branch or PR touched:

```bash
pnpm dev:scan --diff main..HEAD     # local git range (two- or three-dot)
pnpm dev:scan --github-pr 42        # changed files from a GitHub PR
```

- `--diff <base>..<head>` runs `git diff --name-only` over the range. `<head>`
  may be omitted to diff against the working tree (`main..`). The range is
  validated before shelling out to git.
- `--github-pr <number>` derives the file list from the GitHub API (paginated),
  excluding files the PR `removed` — there is nothing left to scan for those.
- The two flags are mutually exclusive; passing both exits non-zero.
- Only the changed blobs are downloaded (the real bandwidth/token win), and the
  pipeline filter enforces the diff set, so findings outside the diff are never
  surfaced. The usual ignore/extension/score rules still apply *within* the set.
- An empty diff (no scannable changes) exits cleanly without an LLM call.

Combine freely with `--frameworks` and `--format sarif`. See the CI workflow in
[`docs/setup/github-app.md`](../setup/github-app.md#7-diff-scoped-scans-on-pull-requests).

## Before a pull request

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm evals:run   # when changing rules or eval fixtures
pnpm build
```

Husky runs checks on commit and push; see [CONTRIBUTING.md](../../CONTRIBUTING.md).
