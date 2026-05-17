# Frameworks

Rule packs are TypeScript modules under `src/lib/rules/`. Each rule maps a code
pattern to a legal article, severity, and suggested fix.

| Framework | Status | Rules | Source |
| --------- | ------ | ----- | ------ |
| GDPR (EU 2016/679) | Shipped | 5 (`GDPR-001`–`GDPR-005`) | [`src/lib/rules/gdpr.ts`](../../src/lib/rules/gdpr.ts) |
| EU AI Act | Shipped | 5 (`AI-ACT-001`–`AI-ACT-005`) | [`src/lib/rules/eu-ai-act.ts`](../../src/lib/rules/eu-ai-act.ts) |
| HIPAA | Planned | — | Contributions welcome |
| SOC 2 | Planned | — | Contributions welcome |
| ISO 27001 | Planned | — | Contributions welcome |
| OWASP Top 10 | Planned | — | Contributions welcome |
| PCI DSS | Planned | — | Contributions welcome |

To add a framework, follow [Rule packs](../contributing/rule-packs.md).
