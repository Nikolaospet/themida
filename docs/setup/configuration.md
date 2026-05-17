# Configuration

All variables are listed in [`.env.example`](../../.env.example). Required
fields depend on whether you use the CLI-only path or the full web stack.

## Scanner (required for any scan)

| Variable | Notes |
| -------- | ----- |
| `LLM_PROVIDER` | `anthropic` (default) or `openai` |
| `ANTHROPIC_API_KEY` | When `LLM_PROVIDER=anthropic` |
| `OPENAI_API_KEY` | When `LLM_PROVIDER=openai` |
| `OPENAI_BASE_URL` | Default OpenAI; set to OpenRouter, Groq, vLLM, etc. |
| `OPENAI_MODEL` | Default `gpt-4.1-mini` |
| `OPENAI_PROVIDER_LABEL` | Optional label in `llm_api_calls.provider` |

## Web UI (required for dashboard)

| Variable | Notes |
| -------- | ----- |
| `NEXT_PUBLIC_SUPABASE_URL` | From `pnpm db:start` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From `pnpm db:start` |
| `SUPABASE_SERVICE_ROLE_KEY` | From `pnpm db:start` |
| `TOKEN_ENCRYPTION_KEY` | `openssl rand -hex 32` — encrypts GitHub tokens at rest |

## GitHub App (connect-repo flow)

See [GitHub App setup](./github-app.md). Typical variables:

- `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_PRIVATE_KEY`
- `GITHUB_APP_INSTALL_STATE_SECRET`
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`

## Optional

| Variable | Purpose |
| -------- | ------- |
| `TRIGGER_SECRET_KEY` | Background scan jobs (Trigger.dev) |
| `RESEND_API_KEY` | Transactional email |
| `NEXT_PUBLIC_SENTRY_DSN` | Error tracking |
| `MAX_DAILY_SPEND_CENTS` | Spend kill switch (default `1000` = $10; `0` blocks scans) |

## Build without secrets

CI and local builds can set `SKIP_ENV_VALIDATION=1` so Next.js compiles without
real keys. Production deployments must supply valid values.
