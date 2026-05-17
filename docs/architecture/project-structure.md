# Project structure

```
themida/
├── src/
│   ├── app/                 Next.js App Router routes
│   │   ├── (marketing)/     Landing, /showcase, /trust
│   │   ├── (dashboard)/     Auth-gated UI
│   │   ├── (auth)/          Login
│   │   ├── sample/[slug]/   Public sample report
│   │   └── api/             Route handlers (incl. /api/sample/[slug]/pdf)
│   ├── components/
│   │   ├── dashboard/       SeverityBadge, ComplianceScore, IssueCard
│   │   └── reports/         ReportPDF (react-pdf)
│   ├── lib/
│   │   ├── rules/           Compliance rule packs (gdpr.ts, eu-ai-act.ts)
│   │   ├── scanner/         File filter, chunker, three-pass pipeline
│   │   ├── github/          Trees + blob fetcher, file cache
│   │   ├── crypto/          AES-256-GCM token encryption
│   │   ├── llm/             Provider-agnostic facade + per-provider adapters
│   │   ├── observability/   Pino logger, cost-tracker, Sentry init
│   │   └── supabase/        Server, browser, admin clients
│   ├── trigger/             Trigger.dev jobs (runScanJob)
│   └── types/database.ts    Generated Supabase types (run pnpm db:types)
├── supabase/migrations/     Versioned SQL migrations
├── evals/repos/             Hand-labelled fixtures for accuracy evals
├── docs/                    Setup, architecture, contributing guides
└── scripts/                 Dev and migration helpers
```

Key entry points:

| Path | Role |
| ---- | ---- |
| `src/lib/scanner/index.ts` | Orchestrates fetch → filter → analyse → verify |
| `src/lib/rules/index.ts` | Rule registry and framework lookup |
| `src/trigger/scan.ts` | Background scan job (Trigger.dev) |
