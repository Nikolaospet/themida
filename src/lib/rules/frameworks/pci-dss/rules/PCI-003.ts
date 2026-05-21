import type { ComplianceRule } from "../../../types";

export const PCI_003: ComplianceRule = {
  id: "PCI-003",
  framework: "pci-dss",
  version: "1.0.0",
  article:
    "PCI DSS v4.0 Requirements 3.6.1.1 / 3.7.1 — Cryptographic key management and protection of keys",
  legalText:
    "Procedures must protect cryptographic keys used to protect stored account data against disclosure and misuse, including storing secret and private keys in the fewest possible locations and forms and protecting them with strong cryptography. Embedding an encryption key, key-encryption key, or PSP/gateway secret as a hardcoded literal in source code stores it in clear text and defeats key management.",
  legalSource: "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
  legalRisk:
    "A leaked or hardcoded key compromises every record it protects; card brands treat key exposure as a full breach of the protected dataset, with fines and mandatory re-encryption/key-rotation.",
  severity: "CRITICAL",
  title: "Cryptographic key or payment secret hardcoded in source",
  description:
    "Detects an encryption key, key-encryption key, or payment-gateway secret assigned as a hardcoded string literal — `encryptionKey = '...'`, an AES key built from a literal, or a live Stripe-style `sk_live_...` secret in code — rather than loaded from a secrets manager/KMS as PCI DSS Req 3.6/3.7 require.",
  codePatterns: [
    "(encryptionKey|encryption_key|aesKey|secretKey|keyEncryptionKey|kek|cardKey|dataKey)\\s*[:=]\\s*[`'\"][^`'\"]{8,}[`'\"]",
    "(createCipheriv|createDecipheriv)\\s*\\([^,]+,\\s*[`'\"][^`'\"]+[`'\"]",
    "sk_live_[A-Za-z0-9]{8,}",
  ],
  keywords: [
    "encryptionKey",
    "secretKey",
    "kek",
    "kms",
    "vault",
    "createCipheriv",
    "sk_live",
    "key management",
    "rotate",
    "secret",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const encryptionKey = 'a3f1c9e7b2d48f60a1c2e3d4f5061728';\nconst cipher = createCipheriv('aes-256-cbc', encryptionKey, iv);",
    "const stripe = new Stripe('sk_live_51HxYz...REDACTED');",
  ],
  complianceExamples: [
    "const encryptionKey = await kms.getDataKey(process.env.KEK_ID);\nconst cipher = createCipheriv('aes-256-gcm', encryptionKey, iv);",
    "const stripe = new Stripe(await secrets.get('stripe/secret_key'));",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} hardcodes a cryptographic key or payment secret in source. PCI DSS Req 3.6/3.7 require keys that protect account data to be stored securely in the fewest locations, protected with strong cryptography, and rotatable — a literal in code (and its version history) is clear-text key storage that compromises everything the key protects.",
    fixDescription:
      "Move the key/secret to a managed KMS or secrets manager and fetch it at runtime; never commit it to source. Use envelope encryption (data keys wrapped by a KEK in the KMS), restrict access by role, and enable rotation. Rotate any key that was ever committed and purge it from history.",
    fixCodeTemplate:
      "const dataKey = await kms.getDataKey(process.env.KEK_ID);\nconst cipher = createCipheriv('aes-256-gcm', dataKey, iv);",
    estimatedFixTime: "~2 hours",
    references: [
      "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
      "https://www.pcisecuritystandards.org/document_library/",
    ],
  },
};
