# Contributing to Themida

## Workflow

1. Create a feature branch off `main`:
   ```bash
   git switch -c feat/<short-description>
   ```
2. Make your changes following the conventions below.
3. Stage and commit — `lint-staged`, `secretlint`, and `commitlint` run automatically.
4. Push the branch — `pnpm typecheck` and `pnpm test` run automatically.
5. Open a pull request to `main`. CI must pass before merge.

## Branch naming

| Prefix     | Use for                              |
| ---------- | ------------------------------------ |
| `feat/`    | New feature                          |
| `fix/`     | Bug fix                              |
| `chore/`   | Tooling, dependencies, housekeeping  |
| `docs/`    | Documentation only                   |
| `refactor/`| Refactor without behaviour change    |
| `test/`    | Adding or updating tests             |

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

Examples:

```
feat(scanner): add OWASP rule for SSRF
fix(auth): refresh GitHub token before expiry
chore(deps): bump next to 16.2.5
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`,
`perf`, `build`, `ci`, `style`, `revert`.

## Code style

- TypeScript everywhere. **No `any`** — use `unknown` and narrow.
- Validate every external input with Zod (env, API requests, AI responses).
- Server-only secrets must never be imported from client modules.
- Keep components < 150 lines. Extract early.
- Prefer Server Components; opt into Client Components only when needed.
- Database access goes through typed Supabase clients; always `select` specific
  columns, never `select('*')` in product code.

## Tests

- Unit tests live next to the code in `*.test.ts(x)` files.
- Run `pnpm test` before opening a PR.
- For new logic, add at least one happy-path test plus one edge case.

## Architecture decisions

For non-trivial design choices, add an ADR under `docs/adr/`:

```bash
cp docs/adr/0001-stack-and-foundations.md docs/adr/000X-<title>.md
```

## Getting help

Open a discussion or ping the maintainer.
