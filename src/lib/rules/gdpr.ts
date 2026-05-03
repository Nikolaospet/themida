import type { ComplianceRule } from "./types";

export const GDPR_001: ComplianceRule = {
  id: "GDPR-001",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 5(1)(f), Article 32",
  legalText:
    "Personal data shall be processed in a manner that ensures appropriate security of the personal data, including protection against unauthorised or unlawful processing, using appropriate technical or organisational measures.",
  legalSource: "https://gdpr-info.eu/art-32-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "CRITICAL",
  title: "Passwords stored without secure hashing",
  description:
    "Detects passwords or sensitive credentials stored as plaintext or with broken hashing algorithms (MD5, SHA1).",
  codePatterns: [
    "md5\\s*\\(\\s*password",
    "sha1\\s*\\(\\s*password",
    "createHash\\([\\'\"]md5[\\'\"]\\)",
    "createHash\\([\\'\"]sha1[\\'\"]\\)",
    "password\\s*=\\s*req\\.body\\.password",
  ],
  keywords: ["password", "passwd", "pwd", "credential", "secret"],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".php", ".go"],
  violationExamples: [
    "const hash = md5(password)",
    "await db.users.create({ password: req.body.password })",
    "crypto.createHash('sha1').update(password).digest('hex')",
  ],
  complianceExamples: [
    "const hash = await bcrypt.hash(password, 12)",
    "const hash = await argon2.hash(password)",
  ],
  findingTemplate: {
    explanation:
      'The code uses {{SPECIFIC_CODE}} which is a broken cryptographic algorithm. MD5 and SHA1 have been cryptographically compromised since 2004 and 2017 respectively. GDPR Article 32 requires "appropriate technical measures" — broken algorithms do not meet this standard.',
    fixDescription:
      "Replace with bcrypt (cost factor 12+) or Argon2id. Never store passwords reversibly.",
    fixCodeTemplate:
      "import bcrypt from 'bcrypt';\nconst SALT_ROUNDS = 12;\nconst hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);",
    estimatedFixTime: "~30 minutes",
    references: [
      "https://gdpr-info.eu/art-32-gdpr/",
      "https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
    ],
  },
};

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

export const GDPR_003: ComplianceRule = {
  id: "GDPR-003",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 17",
  legalText:
    "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay.",
  legalSource: "https://gdpr-info.eu/art-17-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "HIGH",
  title: "No erasure mechanism for user data",
  description:
    "Flags codebases that expose CRUD endpoints over a user resource but have no DELETE handler or `delete-account` route, leaving data subjects unable to exercise their right to erasure.",
  codePatterns: [
    "router\\.(get|post|put|patch)\\([\\'\"]/users",
    "app\\.(get|post|put|patch)\\([\\'\"]/users",
    "@(Get|Post|Put|Patch)\\([\\'\"]/users",
  ],
  keywords: [
    "users",
    "profile",
    "account",
    "delete account",
    "right to erasure",
    "right to be forgotten",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go"],
  violationExamples: ["router.get('/users/:id', getUser); router.post('/users', createUser);"],
  complianceExamples: [
    "router.delete('/users/:id', deleteUser); router.delete('/me', deleteOwnAccount);",
  ],
  findingTemplate: {
    explanation:
      "The codebase manages user resources but exposes no deletion endpoint. Article 17 of the GDPR grants every data subject the right to obtain erasure of personal data concerning them. {{SPECIFIC_CODE}}",
    fixDescription:
      "Add a `DELETE /me` (or equivalent) endpoint that removes the authenticated user's record and any directly-derived data. Ensure the deletion is hard or pseudonymised, not soft-deleted into a still-readable archive.",
    fixCodeTemplate:
      "router.delete('/me', requireAuth, async (req, res) => {\n  await deleteUserAndDerivedData(req.user.id);\n  res.status(204).end();\n});",
    estimatedFixTime: "1-2 hours",
    references: ["https://gdpr-info.eu/art-17-gdpr/"],
  },
};

export const GDPR_004: ComplianceRule = {
  id: "GDPR-004",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 6, Article 7",
  legalText:
    "Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented to processing of his or her personal data.",
  legalSource: "https://gdpr-info.eu/art-7-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "MEDIUM",
  title: "Consent gathered with a pre-checked box",
  description:
    "Detects HTML / JSX forms where the marketing or tracking consent checkbox is initialised to checked / true, violating Article 7's requirement that consent be unambiguous and freely given.",
  codePatterns: [
    "<input[^>]*type=[\\'\"]checkbox[\\'\"][^>]*name=[\\'\"](marketing|consent|newsletter)",
    "<input[^>]*name=[\\'\"](marketing|consent|newsletter)[^>]*type=[\\'\"]checkbox[\\'\"]",
  ],
  keywords: ["checkbox", "consent", "marketing", "newsletter", "checked", "defaultChecked"],
  fileTypes: [".tsx", ".jsx", ".html", ".vue", ".svelte"],
  violationExamples: [
    '<input type="checkbox" name="marketing" defaultChecked />',
    '<input type="checkbox" name="consent" checked />',
  ],
  complianceExamples: [
    '<input type="checkbox" name="marketing" />',
    "const [marketing, setMarketing] = useState(false);",
  ],
  findingTemplate: {
    explanation:
      "The consent checkbox at {{SPECIFIC_CODE}} starts in the checked state. Article 7(2) of the GDPR requires that consent be a clear, affirmative act; pre-ticked boxes are explicitly invalid (recital 32).",
    fixDescription:
      "Initialise the checkbox unchecked. The user must take a positive action to opt in.",
    fixCodeTemplate: '<input type="checkbox" name="marketing" />',
    estimatedFixTime: "~15 minutes",
    references: ["https://gdpr-info.eu/art-7-gdpr/", "https://gdpr-info.eu/recitals/no-32/"],
  },
};

export const GDPR_005: ComplianceRule = {
  id: "GDPR-005",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 44, Article 46",
  legalText:
    "Any transfer of personal data which are undergoing processing or are intended for processing after transfer to a third country shall take place only if the conditions laid down in this Chapter are complied with.",
  legalSource: "https://gdpr-info.eu/art-44-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "HIGH",
  title: "Personal data sent to non-EU third party without safeguards",
  description:
    "Flags client-side or server-side calls to common analytics / telemetry SaaS endpoints (Google Analytics, Mixpanel, Segment, Amplitude) that imply transfer of identifiable user data to non-EU controllers without visible Standard Contractual Clauses or DPA.",
  codePatterns: [
    "google-analytics\\.com",
    "googletagmanager\\.com",
    "api\\.mixpanel\\.com",
    "api\\.segment\\.io",
    "api2\\.amplitude\\.com",
  ],
  keywords: ["analytics", "tracking", "mixpanel", "segment", "amplitude", "datadog"],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".html"],
  violationExamples: [
    "fetch('https://api.mixpanel.com/track', { body: JSON.stringify({ user_id, email }) })",
    '<script src="https://www.googletagmanager.com/gtag/js?id=..." />',
  ],
  complianceExamples: [
    "// EU-hosted analytics (e.g. Plausible self-hosted, Pirsch, Umami) requires no SCC",
    "fetch('https://stats.example.eu/api/event', { body: ... })",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} sends data to a non-EU controller. Articles 44 and 46 of the GDPR require Standard Contractual Clauses, an adequacy decision, or another lawful transfer mechanism for personal data leaving the EEA.",
    fixDescription:
      "Either (a) sign and document SCCs / DPA with the provider and link them in your privacy policy, (b) switch to an EU-hosted analytics provider, or (c) anonymise the payload before it leaves the browser/server.",
    fixCodeTemplate:
      "// EU-hosted alternative\nawait fetch('https://stats.example.eu/api/event', {\n  method: 'POST',\n  body: JSON.stringify({ event: 'pageview' }),\n});",
    estimatedFixTime: "Half day",
    references: [
      "https://gdpr-info.eu/art-44-gdpr/",
      "https://gdpr-info.eu/art-46-gdpr/",
      "https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection_en",
    ],
  },
};

export const GDPR_RULES = [GDPR_001, GDPR_002, GDPR_003, GDPR_004, GDPR_005] as const;
