# Adding a rule pack

Rule packs are plain TypeScript: one module per framework, no plugin API.

## Steps

1. Add `src/lib/rules/<framework>.ts` with at least five rules.
2. Register the framework in [`src/lib/rules/index.ts`](../../src/lib/rules/index.ts).
3. Extend `Framework` in [`src/lib/rules/types.ts`](../../src/lib/rules/types.ts) if needed.
4. Add an eval fixture under `evals/repos/<id>-<framework>/`.
5. Run `pnpm evals:run` and confirm the file filter surfaces expected paths.
6. Open a PR with legal sources cited (regulation article, OWASP entry, NIST control, etc.).

Workflow and DCO: [CONTRIBUTING.md](../../CONTRIBUTING.md).

## Rule shape

```ts
import type { ComplianceRule } from "./types";

export const MY_FRAMEWORK_RULES: ComplianceRule[] = [
  {
    id: "MYF-001",
    framework: "my-framework",
    version: "1.0.0",
    article: "My Framework §1.2.3",
    legalText: "…",
    legalSource: "https://…",
    legalRisk: "…",
    severity: "CRITICAL",
    title: "Don't log raw passwords",
    description: "Logging plaintext passwords on auth failure",
    codePatterns: ["console.log(password)", "logger.info({ password })"],
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
  },
];
```

Copy an existing rule from [`gdpr.ts`](../../src/lib/rules/gdpr.ts) for the full
field set.

## Eval fixtures

Each fixture directory contains:

```
evals/repos/002-md5-password-leftover/
  manifest.json
  code/
    src/...
```

`manifest.json` lists `frameworks` and `expected_findings` (rule id + file path).
See [`evals/manifest.schema.ts`](../../evals/manifest.schema.ts).

## Issue template

Propose a single rule via the **Compliance rule pack** issue template on GitHub.
