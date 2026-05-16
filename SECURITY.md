# Security Policy

## Reporting a vulnerability

If you believe you have found a security vulnerability in Themida, please
**do not open a public issue or pull request**.

Instead, email the maintainer privately:

- **nikolaospetridhs@gmail.com**

If that mailbox bounces, ping the maintainer via a GitHub Issue titled "Security
contact" (without disclosing the vulnerability details) and we'll respond with
an alternate channel.

Please include:

- A description of the issue and its potential impact.
- Steps to reproduce.
- Proof of concept if available.
- Affected versions / commit hashes.

We aim to acknowledge reports within **72 hours** and provide a remediation
timeline within **7 days**.

## Scope

In scope:

- The Themida web application and API routes.
- Background scan jobs (Trigger.dev tasks).
- Build and release pipelines (GitHub Actions).
- Public packages published from this repository.

Out of scope:

- Vulnerabilities in third-party dependencies that are already disclosed and
  awaiting upstream patches (file a Dependabot or upstream issue instead).
- Self-XSS or social-engineering attacks against your own account.
- Issues requiring already-compromised credentials.

## Disclosure

We follow a coordinated disclosure model:

1. We confirm the report and triage severity.
2. We develop and ship a fix.
3. We notify affected users (if any) and credit the reporter (if desired).
4. We publish a public advisory when appropriate.

## Hardening defaults

The project tries to ship sane defaults out of the box:

- Strict Content-Security-Policy and HSTS preload.
- All env vars validated by Zod on boot — fail-fast.
- GitHub App installation tokens encrypted at rest with AES-256-GCM.
- Row-level security on every database table from migration 0001.
- Pre-commit secret scanning (`secretlint`).
- `gitleaks` and `CodeQL` recommended in CI when you self-host.

Thanks for helping keep Themida and its users safe.
