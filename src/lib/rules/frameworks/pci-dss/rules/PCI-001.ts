import type { ComplianceRule } from "../../../types";

export const PCI_001: ComplianceRule = {
  id: "PCI-001",
  framework: "pci-dss",
  version: "1.0.0",
  article: "PCI DSS v4.0 Requirement 3.5.1 — Render PAN unreadable wherever it is stored",
  legalText:
    "PAN is rendered unreadable anywhere it is stored — including on portable digital media, in backup media, and in logs — using one-way hashes based on strong cryptography, truncation, index tokens, or strong cryptography with associated key-management. Persisting a full Primary Account Number (PAN) in a plaintext database column, file, or log violates this requirement.",
  legalSource: "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
  legalRisk:
    "Storing readable PAN is a primary trigger for card-brand fines (commonly $5,000–$100,000 per month), forensic investigation, increased transaction fees, and possible revocation of card-processing privileges.",
  severity: "CRITICAL",
  title: "Primary Account Number (PAN) stored without being rendered unreadable",
  description:
    "Detects a full card PAN (`cardNumber`, `pan`, `creditCard`) written to a database column, ORM model, or file as plaintext — with no truncation, one-way hash, tokenization, or `encrypt(...)` call rendering it unreadable before storage as PCI DSS Req 3.5.1 requires.",
  codePatterns: [
    "(pan|cardNumber|card_number|creditCard|credit_card|accountNumber)\\s*:\\s*(req\\.body|body|input\\.|payload\\.|card\\.)",
    "(pan|cardNumber|card_number|creditCard|credit_card)\\s*:\\s*(varchar|text|String|@db\\.Text)",
    "INSERT\\s+INTO\\s+\\w*(card|payment|pan)\\w*",
  ],
  keywords: [
    "pan",
    "cardNumber",
    "creditCard",
    "primary account number",
    "truncate",
    "tokenize",
    "token",
    "encrypt",
    "hash",
    "render unreadable",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php", ".sql", ".prisma"],
  violationExamples: [
    "await db.payment.create({ data: { userId, cardNumber: body.cardNumber, expiry: body.expiry } });",
    "model Payment {\n  id         String @id\n  cardNumber String\n  expiry     String\n}",
  ],
  complianceExamples: [
    "const token = await vault.tokenize(body.cardNumber);\nawait db.payment.create({ data: { userId, cardToken: token, last4: body.cardNumber.slice(-4) } });",
    "model Payment {\n  id        String @id\n  cardToken String\n  last4     String\n}",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} stores a full Primary Account Number in readable form. PCI DSS Req 3.5.1 requires PAN to be rendered unreadable anywhere it is stored (truncation, one-way hash, tokenization, or strong cryptography); a plaintext column means any database or backup compromise directly exposes cardholder data.",
    fixDescription:
      "Do not store the full PAN unless there is a documented business need. Prefer tokenization via a vault/PSP and keep only a non-sensitive token plus the last four digits. If the PAN must be retained, encrypt it with strong cryptography under managed keys and store only ciphertext, never the cleartext.",
    fixCodeTemplate:
      "const cardToken = await vault.tokenize(body.cardNumber);\nawait db.payment.create({\n  data: {\n    userId,\n    cardToken,\n    last4: body.cardNumber.slice(-4),\n  },\n});",
    estimatedFixTime: "~3 hours",
    references: [
      "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
      "https://www.pcisecuritystandards.org/document_library/",
    ],
  },
};
