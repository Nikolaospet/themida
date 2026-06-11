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
| `pnpm dev:scan --path ./repo` | Scan a local directory (no Supabase / GitHub App) |
| `pnpm dev:scan` | Run full scan pipeline for the latest connected repo |
| `pnpm dev:scan --frameworks gdpr,mica` | Restrict the scan to selected framework packs |
| `pnpm evals:run` | Accuracy evals under `evals/repos/` |
| `pnpm trigger:dev` | Trigger.dev local worker |
| `pnpm secretlint` | Scan working tree for committed secrets |

## Scanning a local directory

`pnpm dev:scan --path <dir>` walks a local directory and runs the full
fetch → filter → analyse → verify pipeline in-process — no Supabase row and no
GitHub App installation required, only an LLM key. Dependency, build, and VCS
directories (`node_modules`, `.git`, `.next`, `dist`, …) and binary/oversized
files are skipped automatically. Combine with `--frameworks`, `--format sarif`,
and `--out`:

```bash
pnpm dev:scan --path .                                  # scan this clone
pnpm dev:scan --path ./my-repo --frameworks gdpr,owasp  # subset of packs
pnpm dev:scan --path ./my-repo --format sarif --out themida.sarif
```

Without `--path`, `dev:scan` pulls files from the GitHub API for the most
recently connected repo in `public.repos` (needs the full web stack).

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

## Exporting scan results

From the CLI, write a SARIF file with `pnpm dev:scan --format sarif --out
<file>` (see above) and upload it in CI with `github/codeql-action/upload-sarif`.

From the dashboard, a completed scan at `/scan/[id]` offers **Download SARIF**
and **Download PDF** buttons. These hit the authenticated routes
`/api/scan/[id]/sarif` and `/api/scan/[id]/pdf`, which re-check that the scan
belongs to the signed-in user and return a 404 otherwise. SARIF reuses
`toSarifString`; the PDF reuses the `ReportPDF` renderer.

## Before a pull request

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm evals:run   # when changing rules or eval fixtures
pnpm build
```

Husky runs checks on commit and push; see [CONTRIBUTING.md](../../CONTRIBUTING.md).
