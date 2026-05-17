# Testing Themida

Themida is a compliance scanner — the value depends on rules firing on the
right code and **not** firing on the wrong code. This page explains how
the test pyramid is structured and what you must add when you ship a rule.

## Layers

| Layer            | Where it lives                                 | What it asserts                                                                 |
| ---------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Unit tests       | `src/**/*.test.ts(x)` next to the code         | Behaviour of one module: scanner pipeline, prompt rendering, framework packs    |
| Pack validation  | `src/lib/rules/frameworks/<id>/pack.test.ts`   | Each pack passes the shared `validatePack()` schema and ships 5+ rules          |
| Eval fixtures    | `evals/repos/<NNN>-<slug>/`                    | Real-world code triggers the right rule on the right file path                  |
| Eval runner      | `evals/runner.test.ts`                         | Manifests parse, file filter surfaces expected paths, every rule has coverage   |
| Live LLM (local) | `evals/live-llm.test.ts`, gated by `LIVE_LLM=1`| End-to-end LLM round-trip; never runs in CI because it costs money              |

Run everything in the order CI uses:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm evals:run
pnpm build
```

What CI runs and which steps block merges: [`docs/development/ci.md`](../development/ci.md).

## Rule and pack tests

Every framework pack ships a `pack.test.ts` next to its `index.ts`. It
calls the shared validator:

```ts
import { describe, expect, it } from "vitest";

import { MY_FW_PACK } from "./index";
import { validatePack } from "../../pack.zod";

describe("my-fw pack", () => {
  it("passes shared pack validation (schema, prefix, uniqueness)", () => {
    expect(validatePack(MY_FW_PACK)).toEqual([]);
  });
});
```

The five-rules-per-pack target is a contributor expectation in
[`CONTRIBUTING.md#definition-of-done`](../../CONTRIBUTING.md#definition-of-done),
not a runtime assertion — it would otherwise fail the scaffold while a
contributor is mid-pack.

`validatePack()` ([`src/lib/rules/pack.zod.ts`](../../src/lib/rules/pack.zod.ts))
checks the Zod schema (every required field, severity enum, URL fields are
URLs, fileType entries start with a dot, semver-style versions) plus
rule-id uniqueness, rule-id prefix matching `meta.ruleIdPrefix`, and that
every rule's `framework` matches the pack's `meta.id`.

`pnpm framework:new` scaffolds this test file for you alongside the
pack itself.

## Eval fixtures

Every fixture lives at `evals/repos/<NNN>-<slug>/`:

```
evals/repos/002-md5-password-leftover/
├── manifest.json
└── code/
    └── src/...
```

`manifest.json` shape (see [`evals/manifest.schema.ts`](../../evals/manifest.schema.ts)):

```json
{
  "name": "002-md5-password-leftover",
  "description": "MD5 used to hash login passwords; triggers GDPR-001.",
  "frameworks": ["gdpr"],
  "expected_findings": [
    {
      "rule_id": "GDPR-001",
      "file_path": "src/auth/login.ts",
      "line_number_approx": 41
    }
  ]
}
```

The schema derives the allowed framework ids and rule-id prefixes from
[`FRAMEWORK_REGISTRY`](../../src/lib/rules/frameworks/registry.ts), so a
typo fails fast instead of being silently accepted.

## Rule-to-fixture coverage

`evals/runner.test.ts` asserts that **every shipped rule** is either
referenced by a fixture's `expected_findings` or listed in
[`evals/rules-exempt.json`](../../evals/rules-exempt.json) with a
non-empty `reason`.

Adding a new rule without coverage will fail this test. You have two
options:

1. **Add a fixture** under `evals/repos/<NNN>-<slug>/` whose manifest
   cites the new rule id (preferred — proves the rule actually fires).
2. **Add an exemption** to `evals/rules-exempt.json`:

   ```json
   {
     "rule_id": "MY-FW-007",
     "reason": "Needs a multi-file fixture spanning client and server analytics; planned for issue #NN."
   }
   ```

Exemptions are a temporary debt — remove the entry the moment you ship a
fixture. The runner test fails if a rule id is both in the exemption list
*and* covered by a fixture, so stale entries surface immediately.

## Live LLM tests (local only)

`evals/live-llm.test.ts` runs end-to-end against the configured LLM
provider. It is gated by `LIVE_LLM=1` and is never run in CI — keep API
calls out of the merge gate so the build stays cheap and deterministic.

```bash
LIVE_LLM=1 pnpm vitest run evals/live-llm.test.ts
```

This requires a populated `.env.local` with `ANTHROPIC_API_KEY` or the
equivalent OpenAI-compatible variables. See
[`docs/setup/configuration.md`](../setup/configuration.md).

## Definition of done for rule-touching PRs

Mirrors the row in [`CONTRIBUTING.md`](../../CONTRIBUTING.md#definition-of-done):

- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm evals:run` all exit `0`
- Every new rule id appears in either a fixture or `rules-exempt.json`
- Pack test (`pack.test.ts`) still passes
- For framework packs: registry entry, 5+ rules, row in `docs/reference/frameworks.md`
