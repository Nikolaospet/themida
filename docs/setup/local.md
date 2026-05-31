# Local setup

Full self-host path: web dashboard, real-time scan progress, PDF export, and
optional GitHub repo connection. For a scan without Supabase or the UI, use the
[CLI quickstart](../../README.md#quickstart) in the README.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- Docker Desktop (for local Supabase)
- An LLM API key (Anthropic, OpenAI, or any OpenAI-compatible endpoint)

## 1. Install

```bash
git clone https://github.com/Nikolaospet/themida.git
cd themida
pnpm install
cp .env.example .env.local
```

Set at least one LLM provider in `.env.local`. See [Configuration](./configuration.md).

## 2. Boot Supabase

```bash
pnpm db:start
pnpm db:reset
pnpm db:types
```

Supabase Studio: <http://127.0.0.1:54323>

After `pnpm db:start`, copy `anon` and `service_role` keys from the CLI output
into `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>

LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...

# openssl rand -hex 32
TOKEN_ENCRYPTION_KEY=<64-hex-char string>
```

## 3. Start the web UI

```bash
pnpm dev
```

Open <http://localhost:3000>, connect a repository, then open it from the dashboard.
On the repo page, choose which compliance frameworks to run (all are selected by
default) and click **Run scan**.

## 4. Optional — GitHub App

Required for the "Connect a repo" flow. Skip if you only use the CLI or local
clones.

Follow [GitHub App setup](./github-app.md), then add `GITHUB_APP_*` and
`GITHUB_CLIENT_*` variables to `.env.local`.

## 5. Optional — Trigger.dev

Without Trigger.dev, scans run inline via dev scripts. For async dashboard
progress, run in a second terminal:

```bash
pnpm trigger:dev
```

Set `TRIGGER_SECRET_KEY` from a [Trigger.dev](https://trigger.dev) account.

## Demo routes

With `pnpm dev` running:

| Route | Description |
| ----- | ----------- |
| `/sample/nodegoat` | Sample NodeGoat report (no signup) |
| `/showcase` | Gallery of public-repo scans |

There is no central Themida server; self-hosting is the full product.

## CLI scan (no web UI)

After connecting at least one repo (via UI or Supabase Studio):

```bash
pnpm dev:scan
```

Uses the most recent repo in `public.repos`. See [Troubleshooting](../troubleshooting.md) if you see "no repos".
