# Frameworks

Rule packs live under `src/lib/rules/frameworks/<id>/`. Each rule maps a
code pattern to a legal article, severity, and suggested fix. The single
source of truth for which packs ship is
[`src/lib/rules/frameworks/registry.ts`](../../src/lib/rules/frameworks/registry.ts).

| Framework          | Status   | Rules                          | Source                                                                                            |
| ------------------ | -------- | ------------------------------ | ------------------------------------------------------------------------------------------------- |
| GDPR (EU 2016/679) | Shipped  | 5 (`GDPR-001`–`GDPR-005`)      | [`src/lib/rules/frameworks/gdpr/`](../../src/lib/rules/frameworks/gdpr/)                          |
| EU AI Act          | Shipped  | 5 (`AI-ACT-001`–`AI-ACT-005`)  | [`src/lib/rules/frameworks/eu-ai-act/`](../../src/lib/rules/frameworks/eu-ai-act/)                |
| MiCA (EU 2023/1114) | Shipped  | 5 (`MICA-001`–`MICA-005`)      | [`src/lib/rules/frameworks/mica/`](../../src/lib/rules/frameworks/mica/)                           |
| HIPAA              | Planned  | —                              | Contributions welcome                                                                              |
| SOC 2              | Planned  | —                              | Contributions welcome                                                                              |
| ISO 27001          | Planned  | —                              | Contributions welcome                                                                              |
| OWASP Top 10       | Shipped  | 5 (`OWASP-001`–`OWASP-005`)    | [`src/lib/rules/frameworks/owasp/`](../../src/lib/rules/frameworks/owasp/)                        |
| PCI DSS            | Planned  | —                              | Contributions welcome                                                                              |

To add a whole framework, follow
[Framework packs](../contributing/framework-packs.md). For a single rule
inside an existing framework, follow
[Adding a single rule](../contributing/rule-packs.md).
