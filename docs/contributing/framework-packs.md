# Adding a framework pack

A "framework pack" is a coordinated set of rules tied to one regulation —
GDPR, the EU AI Act, MiCA, HIPAA. This page walks you through scaffolding,
filling, and shipping a pack.

For a single rule inside an existing framework, see
[`rule-packs.md`](./rule-packs.md).

## TL;DR

```bash
pnpm framework:new mica --name "MiCA" --regulation "https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32023R1114"
# Edit the generated rule files, add four more
pnpm typecheck && pnpm test && pnpm evals:run
```

## Pack layout

Every framework pack lives at `src/lib/rules/frameworks/<id>/` with this shape:

```
src/lib/rules/frameworks/mica/
├── meta.json              # id, displayName, version, regulationUrl, ruleIdPrefix
├── index.ts               # exports MICA_RULES and MICA_PACK
└── rules/
    ├── MICA-001.ts        # one file per rule, prefix matches meta.ruleIdPrefix
    ├── MICA-002.ts
    └── …
```

The pack is wired into the rest of the codebase by a single entry in
[`src/lib/rules/frameworks/registry.ts`](../../src/lib/rules/frameworks/registry.ts):

```ts
import { MICA_PACK } from "./mica";

export const FRAMEWORK_REGISTRY = {
  gdpr: GDPR_PACK,
  "eu-ai-act": EU_AI_ACT_PACK,
  mica: MICA_PACK,
} as const satisfies Record<string, FrameworkPack>;
```

That's it. `Framework`, `ALL_RULES`, `getRulesForFrameworks`, and the eval
manifest schema all derive from this registry — there is no parallel list
to update.

## Scaffolding

```bash
pnpm framework:new <id> [--name "Display Name"] [--prefix PFX] [--regulation URL] [--with-fixture]
```

Arguments:

| Flag             | Default                                  | Notes                                                                 |
| ---------------- | ---------------------------------------- | --------------------------------------------------------------------- |
| `<id>`           | required                                 | kebab-case (e.g. `mica`, `hipaa`, `soc-2`)                            |
| `--name`         | title-cased `<id>`                       | Used in UI and reports                                                |
| `--prefix`       | `<id>` uppercased, dashes stripped       | Rule-id prefix (e.g. `MICA`, `HIPAA`, `SOC2`)                          |
| `--regulation`   | placeholder URL                          | Link to the official regulation text                                  |
| `--with-fixture` | off                                      | Also create a no-finding fixture under `evals/repos/<NNN>-<id>-scaffold/` |

The script:

1. Creates `src/lib/rules/frameworks/<id>/` with `meta.json`, a placeholder
   `<PFX>-001.ts`, and `index.ts`.
2. Patches `registry.ts` to import and register the pack.
3. Optionally creates a noop fixture so `pnpm evals:run` keeps passing
   while you fill in real rules.

## Filling in the pack

A framework pack ships with **at least five rules**. For each rule:

1. Pick a unique id `<PREFIX>-NNN` matching `meta.ruleIdPrefix`.
2. Cite a specific article or control in `article` + `legalSource`.
3. Write `codePatterns` (regex) that match the violation in real code.
4. Add `violationExamples` and `complianceExamples` from real codebases
   you have permission to redistribute.
5. Write a `findingTemplate` with paste-ready remediation.

Field-by-field reference: [`rule-packs.md#rule-shape`](./rule-packs.md#rule-shape).
Copy an existing rule from `src/lib/rules/frameworks/gdpr/rules/GDPR-001.ts`
for the full set of fields.

## Eval fixtures

Each pack ships at least one violation fixture under
`evals/repos/<NNN>-<id>-<scenario>/`. The fixture proves the rule fires.

```
evals/repos/006-mica-custody-logging/
├── manifest.json
└── code/
    └── src/
        └── api/transfer.ts
```

`manifest.json` declares the framework, expected findings, and rule ids:

```json
{
  "name": "006-mica-custody-logging",
  "description": "Logging custody-account balances violates MiCA Art. 67.",
  "frameworks": ["mica"],
  "expected_findings": [
    {
      "rule_id": "MICA-001",
      "file_path": "src/api/transfer.ts",
      "line_number_approx": 12
    }
  ]
}
```

Manifest validation (`evals/manifest.schema.ts`) accepts only framework
ids registered in `FRAMEWORK_REGISTRY` and only rule ids whose prefix
matches one of the registered packs.

Baseline fixtures (`NNN-clean-*`) and scaffold fixtures (`*-scaffold`)
are allowed to be empty; every other fixture must cite at least one rule.

## UI and reference docs

After the rules and fixture exist, add a row in
[`docs/reference/frameworks.md`](../reference/frameworks.md) describing
scope, target users, and current rule coverage. The marketing page and
the dashboard pick up framework metadata from `FRAMEWORK_REGISTRY` at
build time — no further edits required.

## Definition of done

Mirrors the row in [`CONTRIBUTING.md#definition-of-done`](../../CONTRIBUTING.md#definition-of-done):

- `pnpm typecheck`, `pnpm test`, `pnpm evals:run` all exit `0`
- 5+ rules, each with a registered `id` and `legalSource`
- At least one eval fixture under `evals/repos/`
- A row in `docs/reference/frameworks.md`
- Registry entry in `src/lib/rules/frameworks/registry.ts`
- DCO sign-off on every commit
