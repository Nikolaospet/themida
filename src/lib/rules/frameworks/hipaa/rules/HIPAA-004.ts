import type { ComplianceRule } from "../../../types";

export const HIPAA_004: ComplianceRule = {
  id: "HIPAA-004",
  framework: "hipaa",
  version: "1.0.0",
  article: "45 CFR §164.312(b) — Audit controls",
  legalText:
    "A covered entity must implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use ePHI. Reading or modifying a patient record without writing an audit-trail entry (who accessed which record, when) leaves no examinable record of PHI activity.",
  legalSource:
    "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
  legalRisk:
    "Missing audit trails block breach investigation and accounting-of-disclosures requests; a frequent OCR finding, with civil penalties up to ~$2.1M per violation category per year.",
  severity: "MEDIUM",
  title: "PHI accessed without an audit-trail entry",
  description:
    "Detects a read or mutation of a patient/PHI record where the access is recorded only with a stdlib logger (`console.log`, `logger.info`) or not at all — with no call to an append-only audit-log/audit-trail store capturing the acting user, the record id, and the action, as §164.312(b) requires.",
  codePatterns: [
    "(patient|phi|medical|record|ehr)[A-Za-z]*\\.(findUnique|findFirst|findById|findOne|update|delete)\\s*\\(",
    "console\\.(log|info)\\s*\\([^)]*(patient|phi|record|mrn)",
  ],
  keywords: [
    "auditLog",
    "auditTrail",
    "audit",
    "patient",
    "phi",
    "access",
    "accessed",
    "console.log",
    "logger",
    "164.312(b)",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const patient = await db.patient.findUnique({ where: { id } });\nconsole.log('viewed patient', id);\nreturn patient;",
    "await db.patient.update({ where: { id }, data });\n// no audit entry written",
  ],
  complianceExamples: [
    "const patient = await db.patient.findUnique({ where: { id } });\nawait auditLog.append({ actorId: session.user.id, action: 'phi.read', recordId: id, ts: Date.now() });\nreturn patient;",
    "await db.patient.update({ where: { id }, data });\nawait auditLog.append({ actorId: session.user.id, action: 'phi.update', recordId: id, ts: Date.now() });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} accesses PHI without recording it to an audit trail (a stdlib log line is not an audit control). HIPAA §164.312(b) requires mechanisms that record and allow examination of activity in systems containing ePHI, including who accessed which record and when.",
    fixDescription:
      "On every PHI read/write, append an immutable audit entry — actor id, action, record id, timestamp, and source — to a tamper-resistant store separate from application logs. Centralize it in a data-access wrapper so new code paths inherit the audit call.",
    fixCodeTemplate:
      "const patient = await db.patient.findUnique({ where: { id } });\nawait auditLog.append({\n  actorId: session.user.id,\n  action: 'phi.read',\n  recordId: id,\n  ts: Date.now(),\n});\nreturn patient;",
    estimatedFixTime: "~2 hours",
    references: [
      "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
      "https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html",
    ],
  },
};
