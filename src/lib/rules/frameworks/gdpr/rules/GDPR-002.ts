import type { ComplianceRule } from "../../../types";

export const GDPR_002: ComplianceRule = {
  id: "GDPR-002",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 32",
  legalText:
    "Taking into account the state of the art, the costs of implementation and the nature, scope, context and purposes of processing, the controller and the processor shall implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk.",
  legalSource: "https://gdpr-info.eu/art-32-gdpr/",
  legalRisk: "Up to €10,000,000 or 2% of total worldwide annual turnover",
  severity: "HIGH",
  title: "Sensitive data logged in plaintext",
  description:
    "Detects logging of passwords, tokens, API keys or other PII to console / logger output where it can leak via log aggregation.",
  codePatterns: [
    "console\\.log\\([^)]*password",
    "console\\.log\\([^)]*token",
    "logger\\.(info|debug|trace|warn|error)\\([^)]*password",
    "logger\\.(info|debug|trace|warn|error)\\([^)]*api[Kk]ey",
  ],
  keywords: ["console.log", "logger", "password", "token", "apiKey", "secret"],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".php", ".go"],
  violationExamples: [
    "console.log('login attempt', { email, password })",
    "logger.debug(`token=${token}`)",
  ],
  complianceExamples: [
    "logger.debug('login attempt', { email })",
    "logger.debug({ password: '[redacted]' })",
  ],
  findingTemplate: {
    explanation:
      "The code logs sensitive values such as {{SPECIFIC_CODE}}. Logged data is typically aggregated and replicated across multiple systems, multiplying the breach surface beyond what the customer expects.",
    fixDescription:
      "Remove the sensitive field, or replace its value with a redaction marker before logging. Configure your logger's redact list at runtime.",
    fixCodeTemplate:
      "// Pino redact (already configured project-wide):\n// see src/lib/logger/index.ts — `password`, `token`, `apiKey`, `authorization` are auto-redacted.\nlogger.info({ userId }, 'login attempt');",
    estimatedFixTime: "~15 minutes",
    references: ["https://gdpr-info.eu/art-32-gdpr/", "https://owasp.org/www-project-top-ten/"],
  },
};
