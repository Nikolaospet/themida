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

Open a [GitHub Discussion](https://github.com/Nikolaospet/themida/discussions)
or a draft PR with questions inline.

## DCO sign-off

We use the [Developer Certificate of Origin](https://developercertificate.org/).
Every commit must include a `Signed-off-by` trailer asserting you have the
right to license your contribution under AGPL-3.0:

```bash
git commit -s -m "feat(rules): add HIPAA Section 164.312(a)(1) check"
```

The `-s` flag appends `Signed-off-by: Your Name <your.email>` automatically
using your `git config user.name` and `user.email`.

## Adding a new rule pack

The highest-leverage contribution right now is a new compliance framework.
See the [Adding a rule pack](./README.md#adding-a-rule-pack) section in the
README for the file layout, then:

1. Add `src/lib/rules/<framework>.ts` with 5+ rules
2. Register the framework in `src/lib/rules/index.ts`
3. Add at least one eval fixture under `evals/repos/<id>-<framework>/`
4. Run `pnpm evals:run` and confirm the file filter surfaces the right files
5. Open a PR with the rule sources cited (regulation article, OWASP entry,
   NIST control, etc.)

## License of contributions

By submitting a contribution you agree it will be licensed under AGPL-3.0
together with the rest of the project. If your contribution includes code or
content from a third party, please call that out in the PR so we can verify
license compatibility.
