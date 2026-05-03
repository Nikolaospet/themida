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

# 3. Run the dev server
pnpm dev
```

Open <http://localhost:3000>.

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

## Project structure

```
themida/
├── src/
│   ├── app/                Next.js App Router routes
│   ├── lib/                Utilities, clients, scanner pipeline
│   └── env.ts              Zod-validated env vars
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

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Security

See [`SECURITY.md`](./SECURITY.md). Do **not** open public issues for
suspected vulnerabilities.

## License

Proprietary. © AlkeLabs. All rights reserved.
