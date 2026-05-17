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
| `pnpm evals:run` | Accuracy evals under `evals/repos/` |
| `pnpm trigger:dev` | Trigger.dev local worker |
| `pnpm secretlint` | Scan working tree for committed secrets |

## Before a pull request

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm evals:run   # when changing rules or eval fixtures
pnpm build
```

Husky runs checks on commit and push; see [CONTRIBUTING.md](../../CONTRIBUTING.md).
