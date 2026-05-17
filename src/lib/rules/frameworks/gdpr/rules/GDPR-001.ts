import type { ComplianceRule } from "../../../types";

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
