import type { ComplianceRule } from "../../../types";

export const OWASP_004: ComplianceRule = {
  id: "OWASP-004",
  framework: "owasp",
  version: "1.0.0",
  article: "OWASP Top 10:2021 — A05 Security Misconfiguration",
  legalText:
    "Security misconfiguration covers insecure default or hardened-but-wrong settings across the stack. Recurring instances include disabling TLS certificate verification (`rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0`), and overly permissive CORS that reflects or wildcards the origin (`Access-Control-Allow-Origin: *`) — especially when combined with credentialed requests.",
  legalSource: "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
  legalRisk:
    "Man-in-the-middle interception of supposedly encrypted traffic, and cross-origin theft of authenticated responses. Misconfiguration is among the most common categories and is frequently chained into larger compromises.",
  severity: "HIGH",
  title: "TLS verification disabled or wildcard CORS on the response",
  description:
    "Detects code that turns off TLS certificate validation (`rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED`), or sets a wildcard / unconditionally reflected `Access-Control-Allow-Origin`. Both silently weaken transport and same-origin protections that users assume are in force.",
  codePatterns: [
    "rejectUnauthorized\\s*:\\s*false",
    "NODE_TLS_REJECT_UNAUTHORIZED\\s*=\\s*['\"]?0",
    "Access-Control-Allow-Origin['\"]?\\s*[:,]\\s*['\"]\\*['\"]",
    "setHeader\\(\\s*['\"]Access-Control-Allow-Origin['\"]\\s*,\\s*req\\.headers\\.origin",
  ],
  keywords: [
    "rejectUnauthorized",
    "NODE_TLS_REJECT_UNAUTHORIZED",
    "Access-Control-Allow-Origin",
    "cors",
    "credentials",
    "tls",
    "https",
    "helmet",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const agent = new https.Agent({ rejectUnauthorized: false });",
    "res.setHeader('Access-Control-Allow-Origin', '*');\nres.setHeader('Access-Control-Allow-Credentials', 'true');",
    "process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';",
  ],
  complianceExamples: [
    "const agent = new https.Agent({ rejectUnauthorized: true, ca: trustedBundle });",
    "const allowed = new Set(['https://app.example.com']);\nif (allowed.has(origin)) {\n  res.setHeader('Access-Control-Allow-Origin', origin);\n  res.setHeader('Access-Control-Allow-Credentials', 'true');\n}",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} weakens a transport- or origin-level protection. Disabling certificate validation allows undetected man-in-the-middle attacks; a wildcard or reflected CORS origin lets any site read authenticated responses on the user's behalf.",
    fixDescription:
      "Keep TLS verification on (`rejectUnauthorized: true`); supply a custom CA bundle if you need to trust an internal cert. For CORS, replace the wildcard with an explicit allowlist and only echo an origin you have validated — never combine `*` with credentials.",
    fixCodeTemplate:
      "// TLS: keep verification on, pin a CA if needed\nconst agent = new https.Agent({ rejectUnauthorized: true, ca: trustedBundle });\n\n// CORS: explicit allowlist\nconst ALLOWED = new Set(['https://app.example.com']);\nif (ALLOWED.has(origin)) res.setHeader('Access-Control-Allow-Origin', origin);",
    estimatedFixTime: "~30 minutes",
    references: [
      "https://owasp.org/Top10/A05_2021-Security_Misconfiguration/",
      "https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Security_Cheat_Sheet.html",
      "https://cheatsheetseries.owasp.org/cheatsheets/Cross_Origin_Resource_Sharing_Cheat_Sheet.html",
    ],
  },
};
