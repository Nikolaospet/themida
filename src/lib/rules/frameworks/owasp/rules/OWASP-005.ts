import type { ComplianceRule } from "../../../types";

export const OWASP_005: ComplianceRule = {
  id: "OWASP-005",
  framework: "owasp",
  version: "1.0.0",
  article: "OWASP Top 10:2021 — A07 Identification and Authentication Failures",
  legalText:
    "Authentication failures occur when functions related to a user's identity are implemented incorrectly. Examples include accepting JSON Web Tokens signed with the 'none' algorithm (bypassing signature verification), comparing passwords or secrets with plaintext equality instead of a verified hash, and issuing session cookies without the `httpOnly`/`secure` flags so they are exposed to script and to plaintext channels.",
  legalSource: "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/",
  legalRisk:
    "Authentication bypass, session hijacking, and large-scale account takeover. Identification & authentication failures are a perennial Top 10 category.",
  severity: "HIGH",
  title: "Insecure authentication: JWT 'none', plaintext password compare, or non-httpOnly session",
  description:
    "Detects authentication anti-patterns: JWTs verified/signed with `algorithm: 'none'`, password or secret comparison via `===`/`==` against a stored plaintext value, and session/auth cookies set without `httpOnly` (or with `httpOnly: false`).",
  codePatterns: [
    "algorithm[s]?\\s*:\\s*\\[?\\s*['\"]none['\"]",
    "(password|passwd|secret|apiKey|api_key)\\s*===?\\s*(req\\.body|body|user\\.|req\\.query|input)",
    "httpOnly\\s*:\\s*false",
    "cookie\\s*\\([^)]*\\)(?![^;]*httpOnly)",
  ],
  keywords: [
    "jwt",
    "algorithm",
    "none",
    "httpOnly",
    "secure",
    "sameSite",
    "session",
    "bcrypt.compare",
    "timingSafeEqual",
    "password",
    "expiresIn",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const payload = jwt.verify(token, secret, { algorithms: ['none'] });",
    "if (req.body.password === user.password) { issueSession(user); }",
    "res.cookie('sid', token, { httpOnly: false });",
  ],
  complianceExamples: [
    "const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });",
    "if (await bcrypt.compare(req.body.password, user.passwordHash)) { issueSession(user); }",
    "res.cookie('sid', token, { httpOnly: true, secure: true, sameSite: 'lax' });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} implements authentication insecurely. A 'none'-algorithm JWT skips signature verification, a plaintext `===` password check means credentials are stored unhashed (and is timing-attackable), and a non-httpOnly session cookie is readable by injected script — each enabling authentication bypass or session theft.",
    fixDescription:
      "Pin JWT verification to an asymmetric/HMAC algorithm and reject 'none'. Store only password hashes and verify with a constant-time comparator (`bcrypt.compare`, argon2.verify, or `crypto.timingSafeEqual`). Set session cookies with `httpOnly: true`, `secure: true`, and an appropriate `sameSite`.",
    fixCodeTemplate:
      "const payload = jwt.verify(token, publicKey, { algorithms: ['RS256'] });\n\nif (await bcrypt.compare(req.body.password, user.passwordHash)) {\n  res.cookie('sid', token, { httpOnly: true, secure: true, sameSite: 'lax' });\n}",
    estimatedFixTime: "~1 hour",
    references: [
      "https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/",
      "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html",
      "https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html",
    ],
  },
};
