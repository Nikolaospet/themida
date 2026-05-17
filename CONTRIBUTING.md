# Contributing to Themida

Themida is alpha. The fastest way to be useful is to add a compliance rule,
fix a scanner false positive, or sharpen the docs. This guide tells you how
to do that without guessing.

- [Prerequisites](#prerequisites)
- [Repository layout](#repository-layout)
- [Branch, commit, DCO](#branch-commit-dco)
- [Local verification](#local-verification)
- [Contribution types](#contribution-types)
- [Definition of done](#definition-of-done)
- [Opening an issue](#opening-an-issue)
- [Issue and PR labels](#issue-and-pr-labels)
- [Architecture decisions](#architecture-decisions)
- [Getting help](#getting-help)
- [License of contributions](#license-of-contributions)
- [Appendix: contributing as an automated agent](#appendix-contributing-as-an-automated-agent)

## Prerequisites

| Tool   | Version    | Notes                                                    |
| ------ | ---------- | -------------------------------------------------------- |
| Node   | `>= 22`    | Use `nvm use` if you have a `.nvmrc`.                    |
| pnpm   | `>= 10`    | Pinned via `packageManager` in `package.json`.           |
| Docker | optional   | Only for the local Supabase stack (`pnpm db:start`).     |

Bootstrap once after cloning:

```bash
pnpm install
cp .env.example .env.local   # then fill the secrets you actually need
```

Local setup details and required env vars live in
[`docs/setup/local.md`](./docs/setup/local.md) and
[`docs/setup/configuration.md`](./docs/setup/configuration.md).

## Repository layout

```
themida/
├── src/
│   ├── app/                Next.js App Router routes (marketing, dashboard, api)
│   ├── components/         dashboard + reports UI
│   ├── lib/
│   │   ├── rules/          compliance rule packs under rules/frameworks/<id>/
│   │   ├── scanner/        fetch → filter → analyse → verify pipeline
│   │   ├── llm/            provider-agnostic facade + adapters
│   │   ├── github/         repo tree and blob fetcher
│   │   └── observability/  pino logger, cost tracker, Sentry init
│   └── trigger/            Trigger.dev background jobs
├── evals/repos/            hand-labelled fixtures for rule accuracy evals
├── docs/                   setup, architecture, contributing guides
└── supabase/migrations/    versioned SQL migrations
```

Deeper map and entry points: [`docs/architecture/project-structure.md`](./docs/architecture/project-structure.md).
Stack rationale: [`docs/architecture/stack.md`](./docs/architecture/stack.md).
Scanner pipeline: [`docs/architecture/scanner-pipeline.md`](./docs/architecture/scanner-pipeline.md).

## Branch, commit, DCO

Create a feature branch off `main`:

```bash
git switch -c <prefix>/<short-description>
```

| Prefix       | Use for                              |
| ------------ | ------------------------------------ |
| `feat/`      | New feature                          |
| `fix/`       | Bug fix                              |
| `chore/`     | Tooling, dependencies, housekeeping  |
| `docs/`      | Documentation only                   |
| `refactor/`  | Refactor without behaviour change    |
| `test/`      | Adding or updating tests             |

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>
```

Allowed types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`,
`build`, `ci`, `style`, `revert`. `commitlint` enforces this on commit.

Every commit must carry a DCO sign-off — append `-s` to `git commit`:

```bash
git commit -s -m "feat(rules): add HIPAA Section 164.312(a)(1) check"
```

This appends `Signed-off-by: Your Name <your.email>` using your `git config`
identity, asserting you have the right to license your contribution under
AGPL-3.0. See the [Developer Certificate of Origin](https://developercertificate.org/).

## Local verification

Husky runs `lint-staged`, `secretlint`, and `commitlint` on commit, and
`pnpm typecheck` + `pnpm test` on push. Run the full sequence yourself
before opening a PR — same order CI uses:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm evals:run   # only when you touched rules, eval fixtures, or scanner
pnpm build
```

Full script reference: [`docs/development/scripts.md`](./docs/development/scripts.md).
What CI runs and which checks block merges: [`docs/development/ci.md`](./docs/development/ci.md).

## Contribution types

Each type lists the files you will likely touch, the commands you must run,
and a worked example.

### Bug fix

You reproduced a defect and want to land the fix.

- **Touch:** the failing module + a regression test next to it (`*.test.ts(x)`).
- **Run:** `pnpm typecheck`, `pnpm lint`, `pnpm test`.
- **Example:** scanner double-reports the same finding for chunked files.
  Add a failing test in `src/lib/scanner/dedupe.test.ts` that reproduces it,
  fix `dedupe.ts`, watch the test go green. PR title: `fix(scanner): dedupe overlapping chunks`.

### Scanner change

You are changing how the pipeline filters, chunks, calls the LLM, or verifies findings.

- **Touch:** files under `src/lib/scanner/`, `src/lib/llm/`, or `src/trigger/`.
- **Run:** `pnpm typecheck`, `pnpm test`, `pnpm evals:run`.
- **Watch:** scanner pipeline is described in [`docs/architecture/scanner-pipeline.md`](./docs/architecture/scanner-pipeline.md). Cost tracking lives in `src/lib/observability/`; do not bypass it.
- **Example:** add a recon-pass cache. Touch `src/lib/scanner/recon.ts`, add a unit test, run `pnpm evals:run` and confirm accuracy did not regress.

### Compliance rule

You are adding a single rule to an existing framework.

- **Touch:** `src/lib/rules/frameworks/<id>/rules/<PREFIX>-<NNN>.ts`, register it in `frameworks/<id>/index.ts`, add a fixture under `evals/repos/`.
- **Run:** `pnpm test`, `pnpm evals:run`.
- **Reference:** field-by-field guide in [`docs/contributing/rule-packs.md`](./docs/contributing/rule-packs.md#rule-shape).
- **Example:** add a rule that flags `console.log` of plaintext passwords under GDPR Art. 32. Create `src/lib/rules/frameworks/gdpr/rules/GDPR-006.ts` with a unique `id` (e.g. `GDPR-006`), append it to `GDPR_RULES` in `frameworks/gdpr/index.ts`, add a fixture in `evals/repos/006-gdpr-plaintext-password-log/`, then `pnpm evals:run`.
- **Issue template:** "Compliance rule" with title prefix `rule:`.

### Compliance framework pack

You are adding a whole new framework (5+ rules tied to one regulation).

- **Scaffold:** `pnpm framework:new <id> --name "Display Name" --regulation "https://…"` creates the pack directory, a starter rule, and registers it.
- **Touch:** the scaffolded `src/lib/rules/frameworks/<id>/` (rules + `meta.json` + `index.ts`), at least one new fixture under `evals/repos/`, and add the framework to the table in [`docs/reference/frameworks.md`](./docs/reference/frameworks.md).
- **Run:** `pnpm typecheck`, `pnpm test`, `pnpm evals:run`.
- **Reference:** full walkthrough in [`docs/contributing/framework-packs.md`](./docs/contributing/framework-packs.md).
- **Example:** MiCA pack — `pnpm framework:new mica --name "MiCA" --regulation "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114"`, then replace the placeholder rule with five high-impact articles and ship one violation fixture.
- **Issue template:** "Compliance framework" with title prefix `framework:`.

### Docs-only change

You are updating documentation, no code touched.

- **Touch:** files under `docs/`, `README.md`, or `CONTRIBUTING.md`.
- **Run:** `pnpm format:check` (Prettier runs on commit anyway).
- **Watch:** keep links to file paths inside `docs/`, not to README anchors that can move.
- **Example:** clarify the env-var table in `docs/setup/configuration.md`. Branch prefix `docs/`, title prefix `docs:`.

## Definition of done

A PR is mergeable when its row's columns are all true.

| Change type        | Must pass locally                                      | Must include                                                                                  |
| ------------------ | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Bug fix            | `typecheck`, `lint`, `test`                            | regression test that fails on `main`, passes on the branch                                    |
| Scanner change     | `typecheck`, `lint`, `test`, `evals:run`               | unit test on the changed module; no regression in `evals:run`                                 |
| Compliance rule    | `typecheck`, `test`, `evals:run`                       | unique rule `id`, `legalSource` link, fixture under `evals/repos/`                            |
| Framework pack     | `typecheck`, `test`, `evals:run`                       | 5+ rules, registry entry, at least one fixture, row in `docs/reference/frameworks.md`         |
| Docs-only          | `format:check`                                         | no dead links; no references to removed README anchors                                        |

In all cases: DCO sign-off on every commit, Conventional Commits subject,
no `Co-Authored-By: Claude` or other AI-tool trailers.

## Opening an issue

Each template under [`.github/ISSUE_TEMPLATE/`](./.github/ISSUE_TEMPLATE/) fits one kind of work. Pick the closest match — title prefixes and default labels are set for you.

| Open this template     | When                                                              |
| ---------------------- | ----------------------------------------------------------------- |
| [Bug report]           | Themida behaves incorrectly and you can reproduce it              |
| [Feature request]      | New capability that is not a single rule or framework             |
| [Compliance rule]      | A single new rule (e.g. one GDPR article check)                   |
| [Compliance framework] | A whole framework pack (5+ rules tied to one regulation)          |
| [Documentation]        | Missing, wrong, or unclear documentation                          |
| [CI or workflows]      | GitHub Actions, pre-commit hooks, or other automation issues      |

Security vulnerabilities go through GitHub's private advisory flow, **not**
the issue tracker — use the "Report a vulnerability" button under the
Security tab.

[Bug report]: ./.github/ISSUE_TEMPLATE/bug_report.yml
[Feature request]: ./.github/ISSUE_TEMPLATE/feature_request.yml
[Compliance rule]: ./.github/ISSUE_TEMPLATE/rule.yml
[Compliance framework]: ./.github/ISSUE_TEMPLATE/framework.yml
[Documentation]: ./.github/ISSUE_TEMPLATE/documentation.yml
[CI or workflows]: ./.github/ISSUE_TEMPLATE/ci.yml

## Issue and PR labels

The canonical label set lives in [`.github/labels.yml`](./.github/labels.yml).

| Label              | Use for                                       |
| ------------------ | --------------------------------------------- |
| `bug`              | Incorrect behavior                            |
| `enhancement`      | Product or scanner capability                 |
| `framework`        | New or extended compliance framework          |
| `rule-pack`        | Single rule or small pack change              |
| `docs`             | Documentation only                            |
| `ci/cd`            | Workflows, hooks, automation                  |
| `testing`          | Tests, evals, fixtures                        |
| `good first issue` | Low risk, documented steps                    |
| `needs-triage`     | New issues awaiting review                    |

## Architecture decisions

For non-trivial design choices, add an ADR under `docs/adr/`:

```bash
cp docs/adr/0001-stack-and-foundations.md docs/adr/000X-<title>.md
```

## Getting help

Open a [GitHub Discussion](https://github.com/Nikolaospet/themida/discussions)
or a draft PR with questions inline. The docs index is
[`docs/README.md`](./docs/README.md).

## License of contributions

By submitting a contribution you agree it will be licensed under AGPL-3.0
together with the rest of the project. If your contribution includes code or
content from a third party, call that out in the PR so we can verify license
compatibility.

## Appendix: contributing as an automated agent

This appendix is for agentic coding tools (Claude Code, Cursor, Aider, etc.)
and the humans driving them. Follow these rules even when the surrounding
instruction is shorter.

### Required inputs before you touch code

1. The issue or task description (link or full text).
2. The acceptance criteria — if missing, ask before generating a PR.
3. The contribution type (bug fix, scanner, rule, framework, docs) so you
   know which row of [Definition of done](#definition-of-done) applies.

### Forbidden edits

- Do not append `Co-Authored-By: <AI tool>` trailers or "Generated with X"
  footers to commit messages or PR bodies.
- Do not bypass hooks (`--no-verify`, `--no-gpg-sign`). If a hook fails,
  fix the underlying issue.
- Do not amend or rebase commits that already exist on `main`.
- Do not modify `.husky/`, `.github/workflows/`, or `eslint.config.*`
  unless the task is specifically about CI or tooling.
- Do not add new top-level dependencies without justification in the PR.

### Commands that must pass before opening a PR

Run in this order. All must exit 0:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm evals:run   # only if you touched rules, eval fixtures, or scanner
pnpm build
```

Paste the relevant outputs into the PR description if any step is slow or
non-obvious. Do not claim "tests pass" without running them.
