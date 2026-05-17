# Themida

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL%20v3-blue.svg)](./LICENSE)
[![Status](https://img.shields.io/badge/status-alpha-orange.svg)](./docs/reference/frameworks.md)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

LLM-driven compliance scanning for GitHub repositories — file, line, legal
article, and a suggested code fix.

```
src/auth/login.ts:41
  CRITICAL  GDPR Art. 5(1)(f), 32(1)(a)  Password hashed with broken MD5
  Maximum fine: €20M or 4% of revenue
  Fix → bcrypt at cost 12+, or Argon2id
```

---

## About

Themida is for engineering teams, security reviewers, and maintainers who need
actionable compliance findings in their own codebase — not a generic checklist.
Point it at a repository (or a local clone), choose frameworks such as GDPR or
the EU AI Act, and receive line-level issues tied to regulation articles, with
paste-ready remediation. It helps you prioritise fixes before an audit, onboard
developers on what "compliant" looks like in code, and keep reviews consistent.
The project is self-hosted: you supply the LLM API key; there is no Themida
cloud. Treat output as input to human review, not a certified audit.

**Alpha** — GDPR and EU AI Act packs work end-to-end; expect rough edges.
[Open an issue](https://github.com/Nikolaospet/themida/issues) or see
[Contributing](./CONTRIBUTING.md).

---

## How it works

1. **Fetch** — Load repository files (GitHub API or local tree).
2. **Filter** — Drop noise; score files against selected frameworks.
3. **Analyse** — LLM recon and deep-scan passes on relevant chunks.
4. **Verify** — Remove hallucinated paths and already-mitigated findings.

```
Fetch → Filter → Analyse (recon → deep scan) → Verify
```

Technical detail, caching, and logging:
[Scanner pipeline](./docs/architecture/scanner-pipeline.md).

| Capability | Detail |
| ---------- | ------ |
| Findings | File path, line, severity, legal citation |
| Fixes | Suggested code, not prose-only advice |
| Export | PDF reports from the dashboard |
| LLM | Anthropic, OpenAI, or OpenAI-compatible endpoints |
| Hosting | Local Supabase + optional GitHub App + Trigger.dev |

---

## Quickstart

Fastest path: CLI scan with only an LLM key (no Supabase or GitHub App).

```bash
git clone https://github.com/Nikolaospet/themida.git
cd themida
pnpm install
cp .env.example .env.local
# Set LLM_PROVIDER + ANTHROPIC_API_KEY or OPENAI_API_KEY
pnpm dev:scan
```

Requires **Node.js 22+**, **pnpm 10+**, and an LLM API key.

Full web UI, database, and repo connection:
[Local setup](./docs/setup/local.md).

---

## Documentation

| Topic | Link |
| ----- | ---- |
| Docs index | [docs/README.md](./docs/README.md) |
| Setup | [Local](./docs/setup/local.md) · [Configuration](./docs/setup/configuration.md) · [GitHub App](./docs/setup/github-app.md) |
| Development | [Scripts](./docs/development/scripts.md) · [Rule packs](./docs/contributing/rule-packs.md) |
| Architecture | [Pipeline](./docs/architecture/scanner-pipeline.md) · [Structure](./docs/architecture/project-structure.md) · [Stack](./docs/architecture/stack.md) |
| Reference | [Frameworks](./docs/reference/frameworks.md) · [Troubleshooting & FAQ](./docs/troubleshooting.md) |

---

## Frameworks

GDPR and EU AI Act are shipped (five rules each). HIPAA, SOC 2, ISO 27001,
OWASP, and PCI DSS are planned — contributions welcome.

Full table: [Frameworks](./docs/reference/frameworks.md).

---

## Contributing · Security · License

| | |
| - | - |
| **Contributing** | [CONTRIBUTING.md](./CONTRIBUTING.md) — workflow, commits, DCO, rule packs |
| **Security** | [SECURITY.md](./SECURITY.md) — report vulnerabilities privately |
| **License** | [GNU AGPL v3](./LICENSE) — use, modify, and self-host; share changes if you run a modified public network service |

Contributions are licensed under AGPL-3.0 with the rest of the project.
