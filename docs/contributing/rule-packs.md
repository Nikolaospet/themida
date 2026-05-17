# Adding a single rule

For a whole new framework (5+ rules), see
[`framework-packs.md`](./framework-packs.md). This page covers adding **one
rule to an existing framework**.

## Steps

1. Pick the framework directory under `src/lib/rules/frameworks/<id>/`.
2. Create `rules/<PREFIX>-<NNN>.ts` (next free number) following the
   [rule shape](#rule-shape).
3. Register the rule in the framework's `index.ts` so it ends up in the
   exported `<PREFIX>_RULES` array.
4. Add an eval fixture under `evals/repos/<NNN>-<scenario>/` that
   exercises the new rule.
5. Run `pnpm typecheck && pnpm test && pnpm evals:run`.
6. Open a PR with the legal source cited (regulation article, OWASP
   entry, NIST control, etc.).

Workflow and DCO: [`CONTRIBUTING.md`](../../CONTRIBUTING.md).

## Rule shape

```ts
import type { ComplianceRule } from "../../../types";

export const MYF_001: ComplianceRule = {
  id: "MYF-001",
  framework: "my-framework", // must match meta.id of the parent pack
  version: "1.0.0",
  article: "My Framework §1.2.3",
  legalText: "…",
  legalSource: "https://…",
  legalRisk: "Up to €X or Y% of turnover",
  severity: "CRITICAL", // CRITICAL | HIGH | MEDIUM | LOW
  title: "Don't log raw passwords",
  description: "Logging plaintext passwords on auth failure",
  codePatterns: ["console.log\\([^)]*password", "logger\\.(info|debug)\\([^)]*password"],
  keywords: ["password", "credential"],
  fileTypes: [".ts", ".tsx", ".js"],
  violationExamples: ["logger.info('failed: ' + password)"],
  complianceExamples: ["logger.info('login failed for user')"],
  findingTemplate: {
    explanation: "…",
    fixDescription: "…",
    fixCodeTemplate: "…",
    estimatedFixTime: "~30 minutes",
    references: ["https://…"],
  },
};
```

Copy an existing rule from
[`frameworks/gdpr/rules/GDPR-001.ts`](../../src/lib/rules/frameworks/gdpr/rules/GDPR-001.ts)
for the full field set.

## Eval fixtures

Each fixture directory contains:

```
evals/repos/002-md5-password-leftover/
  manifest.json
  code/
    src/...
```

`manifest.json` lists `frameworks` and `expected_findings` (rule id + file path).
See [`evals/manifest.schema.ts`](../../evals/manifest.schema.ts). The schema
validates framework ids and rule-id prefixes against the registry, so a
typo will fail the eval test rather than silently pass.

## Issue template

Propose a single rule via the **Compliance rule** issue template on GitHub.
