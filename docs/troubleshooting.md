# Troubleshooting and FAQ

## Troubleshooting

### `pnpm db:start` hangs or fails

Docker Desktop must be running. Supabase provisions Postgres, GoTrue, Studio, and
Storage in containers. Free ports `54321`–`54324` if another process uses them.

### `Cannot find module '@/lib/...'` after clone

Run `pnpm db:types` to regenerate `src/types/database.ts`. Generated DB types
are not committed.

### Scans return zero findings

- LLM key missing or rate-limited — check logs for `status=429`.
- Repo exceeds the 5K file cap — tarball fallback is not shipped yet.
- File filter rejected all paths — review thresholds in `src/lib/scanner/filter.ts`.

### `pnpm dev:scan` reports "no repos"

You need at least one row in `public.repos`. Connect a repo via the web UI,
complete the [GitHub App](./setup/github-app.md) flow, or insert a test row in
Supabase Studio.

### Husky pre-push fails on `cache.test.ts`

That test needs a reachable Supabase instance. Run `pnpm db:start` before push,
or use `--no-verify` only if you already ran tests locally.

## FAQ

### Does Themida send my code to a third party?

Relevant files are sent to whichever LLM provider you configure, under your API
key and their data-use terms. Themida has no central backend: no telemetry or
analytics server. Network calls are GitHub (when fetching remote repos) and your
LLM provider.

### Why AGPL-3.0?

AGPL keeps forks that run as a public network service open-source. Private and
internal use are unaffected. For other licensing terms, contact the maintainer
(see [LICENSE](../LICENSE)).

### Can I scan a private repo without a GitHub token?

Yes. Use a local clone and the CLI path (`pnpm dev:scan`). The GitHub App is
only for the remote connect-repo workflow.

### Why use an LLM instead of regex-only rules?

Pattern matching catches obvious cases but false-positives heavily on real
codebases. LLM passes reason about context (for example MD5 for passwords vs cache
keys). This project trades API cost for fewer false positives.

### Can I use a local LLM?

Not officially yet. Prompts live in `src/lib/llm/prompts.ts`; provider wiring is
in `src/lib/llm/client.ts`. Contributions for Ollama or llama.cpp are welcome.

## More help

- [Local setup](./setup/local.md)
- [Configuration](./setup/configuration.md)
- [GitHub Discussions](https://github.com/Nikolaospet/themida/discussions)
