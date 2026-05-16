---
name: Compliance rule pack
about: Propose a new rule (or rule pack) — GDPR, HIPAA, SOC 2, etc.
title: "rule: "
labels: ["rule-pack"]
---

## Framework

<!-- e.g. GDPR / HIPAA / SOC 2 / ISO 27001 / OWASP Top 10 / PCI DSS / EU AI Act -->

## Article / control reference

<!-- e.g. GDPR Art. 5(1)(f), HIPAA §164.312(a)(2)(iv), SOC 2 CC6.1.
     A link to the official text is gold. -->

## What violation pattern does it catch?

<!-- The thing in the user's code that triggers this rule. Be specific:
     "weak crypto" is too broad; "MD5 used to hash a password" is good. -->

## Vulnerable code example

```ts
// the bad case
```

## Compliant fix

```ts
// what the user should write instead
```

## Severity

- [ ] CRITICAL  (regulatory breach, immediate fine exposure)
- [ ] HIGH      (clear non-compliance, fix soon)
- [ ] MEDIUM    (best practice violation, deserves a TODO)
- [ ] LOW       (documentation / hygiene)

## False-positive risk

<!-- Where would this rule wrongly fire? e.g. "MD5 used in caching
     contexts is fine — we need to distinguish based on adjacent
     identifiers like `password`, `hash`, `pw`." -->

## Have you written eval fixtures for it?

<!-- Eval fixtures live under `evals/repos/<slug>/` and measure
     detection accuracy. Recommended for non-trivial rules. -->

- [ ] Yes, included in this issue / linked PR
- [ ] No, but I can add some
- [ ] Not sure how — would appreciate guidance

## Are you planning to send a PR?

- [ ] Yes
- [ ] Yes with guidance
- [ ] No, just flagging
