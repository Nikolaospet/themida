# Themida

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)](#status)

> **Open-source compliance scanner for your codebase.**
> Point it at a GitHub repo. Get back every GDPR / EU AI Act issue with the
> exact file, the exact line, the legal article, and the code that fixes it.

```
src/auth/login.ts:41
  CRITICAL  GDPR Art. 5(1)(f), 32(1)(a)  Password hashed with broken MD5
  Maximum fine: €20M or 4% of revenue
  Fix → bcrypt at cost 12+, or Argon2id
```

Vanta and Drata check that you have a password policy *document*. Themida
reads the code and tells you which line stores passwords with MD5.

- 🔍 **Line-level findings** — not "you have weak crypto somewhere"
- ⚖️ **Legal citation** on every issue (article + maximum fine)
- 🛠 **Suggested fix as code** — paste-ready, not prose
- 📄 **PDF export** for auditors
- 🏠 **Self-hostable** — clone, set an API key, scan

[Live sample report](https://themida.dev/sample/nodegoat) ·
[Showcase](https://themida.dev/showcase) ·
[Trust & security](https://themida.dev/trust)

---

## Status

**Alpha.** GDPR and EU AI Act rule packs work end-to-end. Hosted version is
running on Vercel + Supabase + Trigger.dev. Expect rough edges. Not yet
recommended for production audit submissions — use it to find real issues, not
to certify a clean bill.

---

## Quickstart (self-hosted)

Run a scan locally without signing up for anything except an Anthropic key.

```bash
# 1. Clone and install
git clone https://github.com/Nikolaospet/themida
cd themida
pnpm install

# 2. Provide an LLM key
cp .env.example .env.local
# edit .env.local — ANTHROPIC_API_KEY (or OPENROUTER_API_KEY) is the only must-have

# 3. Boot local Supabase + apply migrations
pnpm db:start
pnpm db:reset

# 4. Run the dev server
pnpm dev
```

Open <http://localhost:3000>, connect a GitHub repo, run a scan.

> Docker Desktop is required for the local Supabase stack. If you just want
> to try the scanner against a local folder without Supabase, see
> [`docs/cli-quickstart.md`](./docs/cli-quickstart.md) *(coming)*.

### Or use the hosted version

If you don't want to run your own stack, the hosted version at
<https://themida.dev> runs the same source. Sign in with GitHub, scan up to
5 repos per month for free, no credit card.

---

## How it works

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Fetch   │───▶│  Filter  │───▶│  Analyse │───▶│  Verify  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
 GitHub Trees    Relevance       LLM passes      Drop hallucinations
 + blob API      scoring         (recon →        + already-mitigated
                                  deep scan)
```

1. **Fetch** — Trees API enumerates files; raw-blob API pulls only the ones
   the relevance filter flags. Cached by blob SHA — re-scans only re-fetch
   what changed.
2. **Filter** — `node_modules`, lockfiles, binaries, generated files never
   leave GitHub. Each remaining file is scored against the chosen frameworks.
3. **Analyse** — A three-pass LLM pipeline (recon → deep scan → verify) runs
   concurrent chunks of ≤ 20K tokens. Anthropic (`sonnet-4-6`) by default,
   `openrouter:google/gemma-4-31b-it:free` for cost-free local dev.
4. **Verify** — A final pass drops paths the model hallucinated and findings
   that are already mitigated nearby in the same file.

The full data lifecycle, sub-processors, and threat model live on
[`/trust`](https://themida.dev/trust) and [`SECURITY.md`](./SECURITY.md).

---

## Frameworks

| Framework | Status | Rules |
|-----------|--------|-------|
| GDPR (EU 2016/679) | ✅ Shipped | 5 |
| EU AI Act | ✅ Shipped | 5 |
| HIPAA | 🟡 Open issue — PRs welcome | – |
| SOC 2 | 🟡 Open issue — PRs welcome | – |
| ISO 27001 | 🟡 Open issue — PRs welcome | – |
| OWASP Top 10 | 🟡 Open issue — PRs welcome | – |
| PCI DSS | 🟡 Open issue — PRs welcome | – |

**Adding a framework is one file plus tests.** Rule packs are plain
TypeScript — see [`src/lib/rules/gdpr.ts`](./src/lib/rules/gdpr.ts) for the
reference implementation. We will happily merge well-tested rule packs from
contributors.

---

## Stack

- **Next.js 16** (App Router + RSC) + **React 19** + **TypeScript 5** strict
- **Tailwind CSS v4**
- **Supabase** (Postgres + Auth + Storage + Realtime + RLS)
- **Trigger.dev v3** for background scans
- **Anthropic Claude** (default) or **OpenRouter** for the LLM passes
- **Zod 4** for runtime validation
- **Vitest** + Testing Library

Requires Node.js ≥ 22 and pnpm ≥ 10.

---

## Project structure

```
themida/
├── src/
│   ├── app/                 Next.js App Router routes
│   ├── components/          UI (dashboard, reports/ReportPDF)
│   ├── lib/
│   │   ├── rules/           Compliance rule packs (gdpr.ts, eu-ai-act.ts)
│   │   ├── scanner/         Filter, chunker, three-pass pipeline
│   │   ├── github/          Trees + blob fetcher, file cache
│   │   ├── crypto/          AES-256-GCM token encryption
│   │   └── supabase/        Server / browser / admin clients
│   ├── trigger/             Trigger.dev jobs
│   └── types/database.ts    Generated Supabase types
├── supabase/migrations/     Versioned SQL migrations
├── evals/repos/             Hand-labelled fixture repos for accuracy evals
└── docs/adr/                Architecture decision records
```

---

## Contributing

Contributions welcome — especially:

- **New rule packs** for HIPAA, SOC 2, ISO 27001, OWASP, PCI DSS
- **Eval fixtures** under `evals/repos/` so we can measure detection accuracy
- **Bug reports** with a reproducer repo (public or anonymised)

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the workflow, coding
conventions, and DCO sign-off requirement.

By contributing, you agree your contributions are licensed under AGPL-3.0
under the project's contribution terms.

---

## Roadmap

The short list, in rough priority order:

- Local-folder scanning (no Supabase required) for the OSS CLI path
- Additional rule packs (HIPAA → SOC 2 → ISO 27001 first)
- VS Code extension that surfaces findings inline
- GitHub Action so scans gate PRs in CI
- Multi-LLM provider abstraction (Anthropic, OpenAI, local llama.cpp)

Vote on what you want next via GitHub issues.

---

## Hosted version

Themida.dev is the managed instance — same code, on someone else's machine.
We run it because some users would rather not babysit Postgres + queues.
The hosted version exists to fund the open-source one.

Self-hosting is not "the limited tier" — it's the full product, AGPL-licensed.

---

## Security

Found a vulnerability? Email <security@themida.dev>. We acknowledge within
one business day and we will not lawyer up at researchers acting in good
faith. Full policy: [`SECURITY.md`](./SECURITY.md).

---

## License

[**GNU AGPL v3**](./LICENSE) · © 2026 Nikos P.

In plain English:

- ✅ **Use it** — for personal, internal, or commercial purposes
- ✅ **Modify it, fork it, run it** — anywhere you want
- ✅ **Self-host as a service for your own org**
- ⚠️ **Run a modified version as a public network service?** AGPL requires
  you to publish your changes under the same license. This is the rule that
  keeps Themida from being closed-source-cloned by a bigger vendor.
- 💼 **Need a commercial license?** If AGPL's copyleft clause is a blocker
  (e.g. you want to embed Themida in a closed-source SaaS), reach out at
  <hello@themida.dev> for a commercial license.

The full legal text is in [`LICENSE`](./LICENSE).
