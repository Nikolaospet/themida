import type { ComplianceRule } from "../../../types";

export const PCI_004: ComplianceRule = {
  id: "PCI-004",
  framework: "pci-dss",
  version: "1.0.0",
  article:
    "PCI DSS v4.0 Requirement 10.2.1 / 10.2.1.1 — Audit logs capture all individual access to cardholder data",
  legalText:
    "Audit logs are enabled and active for all system components and cardholder data, and capture all individual user access to cardholder data. Each log entry must allow reconstruction of the event (user identification, type of event, date and time, success or failure, and affected data or resource). Reading cardholder data without writing an audit-log entry — or recording it only with a stdlib logger — fails this requirement.",
  legalSource: "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
  legalRisk:
    "Absent or inadequate logging blocks incident reconstruction and is a frequent QSA finding; it can place an entity out of compliance and extend the scope and cost of any breach forensics.",
  severity: "MEDIUM",
  title: "Access to cardholder data not recorded in an audit log",
  description:
    "Detects a read or mutation of a card/payment record where the access is recorded only with a stdlib logger (`console.log`, `logger.info`) or not at all — with no append to an audit-log store capturing the acting user, action, affected record, and outcome, as PCI DSS Req 10.2.1 requires for all individual access to cardholder data.",
  codePatterns: [
    "(card|payment|cardholder|pan|transaction)[A-Za-z]*\\.(findUnique|findFirst|findById|findOne|update|delete)\\s*\\(",
    "console\\.(log|info)\\s*\\([^)]*(card|payment|pan|cardholder)",
  ],
  keywords: [
    "auditLog",
    "audit",
    "cardholder",
    "card",
    "payment",
    "access",
    "console.log",
    "logger",
    "10.2.1",
    "reconstruct",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const card = await db.card.findUnique({ where: { id } });\nconsole.log('read card', id);\nreturn card;",
    "await db.payment.update({ where: { id }, data });\n// no audit entry written",
  ],
  complianceExamples: [
    "const card = await db.card.findUnique({ where: { id } });\nawait auditLog.append({ actorId: session.user.id, action: 'chd.read', recordId: id, ts: Date.now() });\nreturn card;",
    "await db.payment.update({ where: { id }, data });\nawait auditLog.append({ actorId: session.user.id, action: 'chd.update', recordId: id, ts: Date.now() });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} accesses cardholder data without writing an audit-log entry (a stdlib log line is not an audit trail). PCI DSS Req 10.2.1 requires logging all individual access to cardholder data with enough detail to reconstruct the event — who, what, when, and success/failure.",
    fixDescription:
      "On every cardholder-data read/write, append an immutable audit entry — actor id, action, affected record, timestamp, and outcome — to a tamper-resistant store separate from application logs. Centralize it in a data-access wrapper so new code paths inherit the audit call, and ship the logs to a monitored aggregator.",
    fixCodeTemplate:
      "const card = await db.card.findUnique({ where: { id } });\nawait auditLog.append({\n  actorId: session.user.id,\n  action: 'chd.read',\n  recordId: id,\n  outcome: 'success',\n  ts: Date.now(),\n});\nreturn card;",
    estimatedFixTime: "~2 hours",
    references: [
      "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
      "https://www.pcisecuritystandards.org/document_library/",
    ],
  },
};
