# Stack

| Layer | Technology |
| ----- | ---------- |
| App | Next.js 16 (App Router, React Server Components), React 19 |
| Language | TypeScript 5 strict (`noUncheckedIndexedAccess`) |
| Styling | Tailwind CSS v4 |
| Data | Supabase (Postgres, Auth, Storage, Realtime, RLS) |
| Jobs | Trigger.dev v3 (background scans) |
| LLM | Anthropic, OpenAI, or any Chat Completions-compatible API |
| Validation | Zod 4 |
| Tests | Vitest, Testing Library |
| Logging | Pino (structured JSON, sensitive-field redaction) |
| Errors | Sentry (optional, EU region) |
| Reports | `@react-pdf/renderer` |

Design rationale and trade-offs: [ADR 0001](../adr/0001-stack-and-foundations.md).
