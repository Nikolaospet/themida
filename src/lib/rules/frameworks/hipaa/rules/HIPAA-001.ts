import type { ComplianceRule } from "../../../types";

export const HIPAA_001: ComplianceRule = {
  id: "HIPAA-001",
  framework: "hipaa",
  version: "1.0.0",
  article: "45 CFR §164.312(a)(2)(iv) — Encryption and decryption (PHI at rest)",
  legalText:
    "A covered entity or business associate must implement a mechanism to encrypt and decrypt electronic protected health information (ePHI). Storing identifiers such as SSN, medical record number, or diagnosis in a plaintext database column or file leaves ePHI unprotected at rest and is an addressable implementation specification that, absent a documented equivalent, must be met.",
  legalSource:
    "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
  legalRisk:
    "Civil money penalties up to ~$2.1M per violation category per year (inflation-adjusted), plus mandatory breach notification and potential criminal liability for willful neglect.",
  severity: "CRITICAL",
  title: "PHI persisted to storage without encryption at rest",
  description:
    "Detects electronic protected health information (SSN, MRN, diagnosis, ICD code, insurance id) written to a database column, ORM model, or file as plaintext — with no field-level encryption, KMS envelope, or `encrypt(...)` call wrapping the value before it is stored.",
  codePatterns: [
    "(ssn|socialSecurity|mrn|medicalRecordNumber|diagnosis|icd10|icdCode|insuranceId)\\s*:\\s*(req\\.body|body|patient\\.|input\\.|payload\\.)",
    "(ssn|mrn|diagnosis|icd10|phi)\\s*:\\s*(varchar|text|String|@db\\.Text)",
    "INSERT\\s+INTO\\s+\\w*(patient|phi|medical|health|ehr)\\w*",
  ],
  keywords: [
    "ssn",
    "mrn",
    "diagnosis",
    "icd10",
    "patient",
    "phi",
    "ePHI",
    "encrypt",
    "kms",
    "ciphertext",
    "at rest",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php", ".sql", ".prisma"],
  violationExamples: [
    "await db.patient.create({ data: { name, ssn: body.ssn, diagnosis: body.diagnosis } });",
    "model Patient {\n  id        String @id\n  ssn       String\n  diagnosis String\n}",
  ],
  complianceExamples: [
    "await db.patient.create({ data: { name, ssn: encryptPhi(body.ssn), diagnosis: encryptPhi(body.diagnosis) } });",
    "model Patient {\n  id           String @id\n  ssnCiphertext Bytes\n  diagnosisCiphertext Bytes\n}",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} stores electronic protected health information in plaintext. HIPAA §164.312(a)(2)(iv) requires a mechanism to encrypt ePHI at rest; an unencrypted column or file means a database/backup compromise directly exposes PHI and triggers breach-notification obligations.",
    fixDescription:
      "Encrypt PHI fields before persistence using envelope encryption with a managed key (KMS/HSM), or enable transparent column-level encryption. Store ciphertext (and any IV/auth tag), never the cleartext, and restrict decryption to the minimum necessary code paths.",
    fixCodeTemplate:
      "await db.patient.create({\n  data: {\n    name,\n    ssnCiphertext: await kms.encrypt(body.ssn),\n    diagnosisCiphertext: await kms.encrypt(body.diagnosis),\n  },\n});",
    estimatedFixTime: "~2 hours",
    references: [
      "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
      "https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html",
    ],
  },
};
