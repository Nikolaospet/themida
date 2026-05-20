import type { ComplianceRule } from "../../../types";

export const OWASP_002: ComplianceRule = {
  id: "OWASP-002",
  framework: "owasp",
  version: "1.0.0",
  article: "OWASP Top 10:2021 — A02 Cryptographic Failures",
  legalText:
    "Cryptographic failures (formerly 'Sensitive Data Exposure') concern the protection of data in transit and at rest. Common weaknesses include the use of broken or weak cryptographic algorithms (MD5, SHA-1), deprecated cipher APIs that default to insecure modes (ECB), and the generation of security-sensitive tokens from a non-cryptographic random source such as `Math.random()`.",
  legalSource: "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/",
  legalRisk:
    "Disclosure of credentials, session tokens, and personal data; predictable reset tokens enable account takeover. Frequently the technical root cause behind data-protection penalties.",
  severity: "HIGH",
  title: "Weak or misused cryptography (broken hash, deprecated cipher, or non-CSPRNG token)",
  description:
    "Detects security-sensitive cryptography built on weak primitives: hashing with MD5/SHA-1, the deprecated `crypto.createCipher` API (insecure default mode, no IV), or deriving tokens/secrets/passwords from `Math.random()` instead of a cryptographically secure RNG.",
  codePatterns: [
    "createHash\\s*\\(\\s*['\"](md5|sha1)['\"]\\s*\\)",
    "crypto\\.createCipher\\s*\\(",
    "Math\\.random\\s*\\(\\s*\\)[^\\n;]*(token|secret|otp|password|key|nonce|reset)",
    "(token|secret|otp|reset[A-Za-z]*)\\s*=\\s*[^\\n;]*Math\\.random\\s*\\(",
  ],
  keywords: [
    "md5",
    "sha1",
    "createHash",
    "createCipher",
    "Math.random",
    "token",
    "secret",
    "randomBytes",
    "aes-256-gcm",
    "scrypt",
    "bcrypt",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const resetToken = String(Math.random()).slice(2);",
    "const cipher = crypto.createCipher('aes-256-cbc', secret);",
    "const fingerprint = crypto.createHash('md5').update(email).digest('hex');",
  ],
  complianceExamples: [
    "const resetToken = crypto.randomBytes(32).toString('hex');",
    "const iv = crypto.randomBytes(12);\nconst cipher = crypto.createCipheriv('aes-256-gcm', key, iv);",
    "const fingerprint = crypto.createHash('sha256').update(email).digest('hex');",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} relies on weak or misused cryptography. Broken hashes (MD5/SHA-1), `createCipher` (no IV, insecure default mode), and `Math.random()` for security tokens are all predictable or reversible, undermining confidentiality and integrity guarantees.",
    fixDescription:
      "Replace weak primitives with vetted ones: use SHA-256+ for digests, `createCipheriv` with a random IV and an AEAD mode (AES-256-GCM), and `crypto.randomBytes`/`crypto.randomUUID` for any token, secret, or salt. Hash passwords with bcrypt/argon2/scrypt — never a bare digest.",
    fixCodeTemplate:
      "import crypto from 'node:crypto';\n\nconst resetToken = crypto.randomBytes(32).toString('hex');\nconst iv = crypto.randomBytes(12);\nconst cipher = crypto.createCipheriv('aes-256-gcm', key, iv);",
    estimatedFixTime: "~45 minutes",
    references: [
      "https://owasp.org/Top10/A02_2021-Cryptographic_Failures/",
      "https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html",
    ],
  },
};
