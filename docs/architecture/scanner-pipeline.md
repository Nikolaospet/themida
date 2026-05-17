# Scanner pipeline

Themida scans a repository in four stages. Each LLM call is logged to
`public.llm_api_calls` with provider, model, pass, token usage, duration, and
cost (for paid models).

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Fetch   │───▶│  Filter  │───▶│  Analyse │───▶│  Verify  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
 GitHub Trees    Relevance       LLM passes      Drop hallucinations
 + blob API      scoring         (recon →        + already-mitigated
                                  deep scan)
```

## Fetch

- GitHub Trees API enumerates files; the raw-blob API pulls content for paths
  the filter will need.
- Blobs are gzipped into `public.repo_file_cache` keyed by `(repo_id, blob_sha)`.
- Re-scans only re-fetch changed blobs.

## Filter

- Drops `node_modules`, lockfiles, binaries, and generated files.
- Scores remaining files against the selected [frameworks](../reference/frameworks.md).
- Irrelevant paths never reach the LLM.

Implementation: `src/lib/scanner/filter.ts`

## Analyse

Three-pass LLM pipeline:

1. **Recon** — up to 15 suspect paths.
2. **Deep scan** — findings per chunk (≤ 20K tokens per chunk, concurrency cap 2).

Implementation: `src/lib/scanner/recon.ts`, `src/lib/scanner/deep.ts`

## Verify

- Removes hallucinated file paths.
- Drops findings already mitigated nearby in the same file.
- Batches findings in groups of 30.

Implementation: `src/lib/scanner/verify.ts`

## Data and security

Retention, encryption, and threat model: [SECURITY.md](../../SECURITY.md).

## Related

- [Project structure](./project-structure.md)
- [Stack](./stack.md)
- [ADR 0001 — Stack and foundations](../adr/0001-stack-and-foundations.md)
