/**
 * Pre-rendered sample scan data for the public showcase pages.
 *
 * These are NOT real database rows — they are typed fixtures that
 * mimic the shape of ScanRow + IssueCardData so the existing
 * <ScanResults> component renders without any DB query or auth.
 *
 * Used by /sample/[slug] to give visitors (investors, prospects) a
 * concrete proof of what Themida produces, without requiring signup.
 */

import type { IssueCardData } from "@/components/dashboard/IssueCard";
import type { Database } from "@/types/database";

type ScanRow = Database["public"]["Tables"]["scans"]["Row"];

export interface Sample {
  slug: string;
  repoFullName: string;
  blurb: string;
  defaultBranch: string;
  commitSha: string;
  scan: ScanRow;
  issues: IssueCardData[];
}

// ---------------------------------------------------------------------------
// NodeGoat — OWASP intentionally-vulnerable Node.js training app
// ---------------------------------------------------------------------------

const NODEGOAT_ISSUES: IssueCardData[] = [
  {
    id: "ng-1",
    severity: "CRITICAL",
    rule_id: "GDPR-001",
    title: "Password hashed with broken MD5 algorithm",
    file_path: "app/data/user-dao.js",
    line_number: 41,
    code_snippet: "var passwordHash = crypto.createHash('md5').update(userPassword).digest('hex');",
    explanation:
      "The code hashes user passwords using MD5, which has been cryptographically broken since 2004. " +
      "Collisions can be produced in seconds on commodity hardware, defeating the purpose of hashing.",
    legal_reference: "GDPR Article 5(1)(f), Article 32(1)(a)",
    legal_risk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
    fix_description:
      "Replace MD5 with bcrypt at cost factor 12+ or Argon2id. Migrate existing hashes on next login.",
    fix_code:
      "const bcrypt = require('bcrypt');\nconst SALT_ROUNDS = 12;\nconst passwordHash = await bcrypt.hash(userPassword, SALT_ROUNDS);",
    fix_time_estimate: "~45 minutes",
  },
  {
    id: "ng-2",
    severity: "CRITICAL",
    rule_id: "GDPR-014",
    title: "SQL-style injection via raw query interpolation",
    file_path: "app/data/allocations-dao.js",
    line_number: 28,
    code_snippet: "const searchCriteria = eval('(function() { return ' + userInput + ';})()');",
    explanation:
      "User-controlled input is passed directly to eval(), allowing arbitrary code execution. " +
      "An attacker can read, modify, or destroy every record in the database.",
    legal_reference: "GDPR Article 32(1)(b), OWASP A03:2021 (Injection)",
    legal_risk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
    fix_description:
      "Never eval user input. Use a JSON parser or a structured query builder with parameterised inputs.",
    fix_code:
      "const searchCriteria = JSON.parse(userInput);\n// Or, for queries:\ndb.collection('allocations').find({ userId: { $eq: userId } });",
    fix_time_estimate: "~1 hour",
  },
  {
    id: "ng-3",
    severity: "CRITICAL",
    rule_id: "GDPR-022",
    title: "Hard-coded session secret in source",
    file_path: "config/env/all.js",
    line_number: 17,
    code_snippet: 'sessionSecret: "s3cr3t",',
    explanation:
      "The session secret is committed to the repository. Anyone with read access to the source — including " +
      "former employees and anyone who has cloned the repo — can forge valid session cookies for any user.",
    legal_reference: "GDPR Article 32(1), ISO 27001 A.9.4.3",
    legal_risk: "Account takeover; full impersonation of any user",
    fix_description:
      "Move the secret to an environment variable. Rotate immediately. Audit Git history for prior commits.",
    fix_code:
      "sessionSecret: process.env.SESSION_SECRET,\n// .env (not committed):\n// SESSION_SECRET=<32-byte random hex>",
    fix_time_estimate: "~30 minutes",
  },
  {
    id: "ng-4",
    severity: "HIGH",
    rule_id: "GDPR-007",
    title: "Personal data logged in plaintext",
    file_path: "app/routes/session.js",
    line_number: 73,
    code_snippet: "console.log('Login attempt for user: ' + userName + ', password: ' + password);",
    explanation:
      "User passwords and emails are written to application logs. Logs are commonly retained for months, " +
      "shared with third-party log aggregators, and accessible to anyone with infra access — none of which is consent-bound.",
    legal_reference: "GDPR Article 5(1)(c) (data minimisation), Article 32",
    legal_risk: "Up to €10,000,000 or 2% of global turnover",
    fix_description:
      "Remove the password from the log line entirely. Redact email or hash it for correlation if needed.",
    fix_code: "logger.info('Login attempt', { userIdHash: sha256(userName).slice(0, 8) });",
    fix_time_estimate: "~20 minutes",
  },
  {
    id: "ng-5",
    severity: "HIGH",
    rule_id: "GDPR-031",
    title: "Cross-site scripting via unescaped template",
    file_path: "app/views/contributions.html",
    line_number: 19,
    code_snippet: "<p>Welcome back, {{{ userName }}}!</p>",
    explanation:
      "The triple-brace mustache tag emits the user-controlled value without HTML escaping. " +
      "An attacker who controls userName (for example, by registering with a name containing <script>) " +
      "can execute JavaScript in any visitor's browser, exfiltrating session cookies or PII.",
    legal_reference: "GDPR Article 32, OWASP A03:2021",
    legal_risk: "Session theft; PII exfiltration; CSRF amplification",
    fix_description:
      "Use the double-brace tag which auto-escapes, or sanitise with a vetted library if HTML rendering is intentional.",
    fix_code: "<p>Welcome back, {{ userName }}!</p>",
    fix_time_estimate: "~15 minutes",
  },
  {
    id: "ng-6",
    severity: "HIGH",
    rule_id: "GDPR-018",
    title: "Sensitive data transmitted over HTTP",
    file_path: "server.js",
    line_number: 64,
    code_snippet: "http.createServer(app).listen(port);",
    explanation:
      "The application accepts authentication credentials and personal data over plain HTTP. " +
      "Every login session is observable on the wire by intermediaries, ISPs, or anyone on the same Wi-Fi.",
    legal_reference: "GDPR Article 32(1)(a), PCI DSS 4.0 §4.2",
    legal_risk: "Up to €10,000,000 or 2% of global turnover; PCI non-compliance",
    fix_description:
      "Terminate TLS at a reverse proxy (e.g. nginx, Cloudflare) and redirect HTTP → HTTPS. Set HSTS.",
    fix_code:
      "// Behind a TLS-terminating proxy:\napp.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true }));",
    fix_time_estimate: "~2 hours (infra)",
  },
  {
    id: "ng-7",
    severity: "HIGH",
    rule_id: "GDPR-009",
    title: "No rate limiting on authentication endpoint",
    file_path: "app/routes/session.js",
    line_number: 12,
    code_snippet: "app.post('/login', sessionHandler.handleLoginRequest);",
    explanation:
      "The /login endpoint has no rate limiting, allowing unlimited credential-stuffing or brute-force attempts. " +
      "Combined with the MD5 hashing issue above, an attacker can take over accounts en masse.",
    legal_reference: "GDPR Article 32(1)(b), NIST 800-63B §5.2.2",
    legal_risk: "Account takeover at scale",
    fix_description:
      "Add a per-IP and per-account rate limiter (e.g. express-rate-limit). Lock accounts after 10 failures.",
    fix_code:
      "const rateLimit = require('express-rate-limit');\nconst loginLimiter = rateLimit({ windowMs: 60_000, max: 5 });\napp.post('/login', loginLimiter, handleLoginRequest);",
    fix_time_estimate: "~45 minutes",
  },
  {
    id: "ng-8",
    severity: "HIGH",
    rule_id: "GDPR-025",
    title: "User can read other users' profile data (IDOR)",
    file_path: "app/routes/profile.js",
    line_number: 38,
    code_snippet: "const userId = req.query.userId;\nUserDAO.getUserById(userId, callback);",
    explanation:
      "The endpoint trusts a client-supplied userId without verifying it matches the authenticated session. " +
      "Visiting /profile?userId=42 returns user 42's full profile to anyone logged in.",
    legal_reference: "GDPR Article 32, OWASP A01:2021 (Broken Access Control)",
    legal_risk: "Mass PII disclosure",
    fix_description:
      "Use the authenticated session's userId. Never accept identity from query string.",
    fix_code: "const userId = req.session.userId;\nUserDAO.getUserById(userId, callback);",
    fix_time_estimate: "~30 minutes",
  },
  {
    id: "ng-9",
    severity: "MEDIUM",
    rule_id: "GDPR-019",
    title: "Missing CSRF protection on state-changing routes",
    file_path: "app/routes/index.js",
    line_number: 22,
    code_snippet: "app.post('/contributions', contributionsHandler.handleContributionsUpdate);",
    explanation:
      "POST routes accept requests without verifying a CSRF token. A malicious site can submit a hidden form " +
      "to /contributions on behalf of a logged-in victim, transferring or altering their data.",
    legal_reference: "GDPR Article 32, OWASP A01:2021",
    legal_risk: "Unauthorised data modification",
    fix_description:
      "Add a CSRF middleware (csurf or modern equivalents) and inject the token into forms / SameSite=strict cookies.",
    fix_code: "const csrf = require('csurf');\napp.use(csrf({ cookie: { sameSite: 'strict' } }));",
    fix_time_estimate: "~1 hour",
  },
  {
    id: "ng-10",
    severity: "MEDIUM",
    rule_id: "GDPR-012",
    title: "No explicit consent banner before tracking",
    file_path: "app/views/layout.html",
    line_number: 8,
    code_snippet: '<script src="https://www.googletagmanager.com/gtag/js?id=UA-XXXX"></script>',
    explanation:
      "Google Analytics loads on every page before the user has consented to non-essential cookies. " +
      "Under GDPR + ePrivacy, analytics cookies are non-essential and require prior opt-in for EU visitors.",
    legal_reference: "ePrivacy Directive Art. 5(3), GDPR Article 7",
    legal_risk: "Up to €20,000,000 or 4% of global turnover",
    fix_description:
      "Defer analytics until consent is given. Implement a compliant consent banner (e.g. Cookiebot, Klaro).",
    fix_code:
      "// Load analytics only after consent:\nif (consentStore.getConsent('analytics')) {\n  loadGoogleAnalytics();\n}",
    fix_time_estimate: "~3 hours",
  },
  {
    id: "ng-11",
    severity: "MEDIUM",
    rule_id: "GDPR-027",
    title: "Cookie set without Secure or HttpOnly flags",
    file_path: "app/server.js",
    line_number: 89,
    code_snippet: "app.use(session({ secret: secret, cookie: { maxAge: 60_000 } }));",
    explanation:
      "Session cookies are issued without Secure (transmitted over HTTP) or HttpOnly (readable by JavaScript) flags, " +
      "making them recoverable by passive network attackers and by any XSS injection.",
    legal_reference: "GDPR Article 32, OWASP A02:2021",
    legal_risk: "Session theft",
    fix_description: "Set Secure, HttpOnly, and SameSite=Lax on every session cookie.",
    fix_code:
      "app.use(session({\n  secret,\n  cookie: { maxAge: 60_000, secure: true, httpOnly: true, sameSite: 'lax' },\n}));",
    fix_time_estimate: "~10 minutes",
  },
  {
    id: "ng-12",
    severity: "LOW",
    rule_id: "GDPR-033",
    title: "Verbose error messages disclose stack traces",
    file_path: "app/server.js",
    line_number: 132,
    code_snippet: "app.use(errorHandler({ dumpExceptions: true, showStack: true }));",
    explanation:
      "Uncaught exceptions render full stack traces to clients in production, leaking file paths, library " +
      "versions, and sometimes credentials embedded in error messages.",
    legal_reference: "OWASP A09:2021 (Security Logging Failures)",
    legal_risk: "Information disclosure aiding subsequent attacks",
    fix_description: "Show a generic error page in production. Log the trace server-side only.",
    fix_code:
      "if (process.env.NODE_ENV === 'production') {\n  app.use((err, req, res, _next) => {\n    logger.error(err);\n    res.status(500).send('Something went wrong.');\n  });\n}",
    fix_time_estimate: "~20 minutes",
  },
];

const NODEGOAT_SCAN: ScanRow = {
  id: "sample-nodegoat",
  repo_id: "sample-repo-nodegoat",
  user_id: "00000000-0000-0000-0000-000000000000",
  status: "completed",
  frameworks: ["gdpr"],
  progress: { phase: "done" },
  compliance_score: 52,
  total_issues: NODEGOAT_ISSUES.length,
  critical_count: NODEGOAT_ISSUES.filter((i) => i.severity === "CRITICAL").length,
  high_count: NODEGOAT_ISSUES.filter((i) => i.severity === "HIGH").length,
  medium_count: NODEGOAT_ISSUES.filter((i) => i.severity === "MEDIUM").length,
  low_count: NODEGOAT_ISSUES.filter((i) => i.severity === "LOW").length,
  files_scanned: 47,
  files_total: 73,
  credits_used: 10,
  error_message: null,
  estimated_fix_time: "6-8 hours",
  started_at: "2026-05-15T10:00:00Z",
  completed_at: "2026-05-15T10:00:42Z",
  created_at: "2026-05-15T09:59:55Z",
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export const SAMPLES: Record<string, Sample> = {
  nodegoat: {
    slug: "nodegoat",
    repoFullName: "OWASP/NodeGoat",
    blurb: "Intentionally vulnerable Node.js training app curated by OWASP.",
    defaultBranch: "master",
    commitSha: "main",
    scan: NODEGOAT_SCAN,
    issues: NODEGOAT_ISSUES,
  },
};

export function getSample(slug: string): Sample | null {
  return SAMPLES[slug] ?? null;
}

export function listSamples(): Sample[] {
  return Object.values(SAMPLES);
}
