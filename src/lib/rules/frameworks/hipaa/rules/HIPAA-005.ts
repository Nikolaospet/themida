import type { ComplianceRule } from "../../../types";

export const HIPAA_005: ComplianceRule = {
  id: "HIPAA-005",
  framework: "hipaa",
  version: "1.0.0",
  article:
    "45 CFR §164.308(a)(1)(ii)(D), §164.308(a)(5)(ii)(C) — Information system activity & log-in monitoring",
  legalText:
    "A covered entity must implement procedures to regularly review records of information system activity and to monitor log-in attempts and report discrepancies. A denied or failed attempt to access PHI that is silently rejected — returning 403/401 or swallowing the error without recording the failure — defeats the monitoring needed to detect intrusion and to support breach assessment.",
  legalSource:
    "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.308",
  legalRisk:
    "Undetected unauthorized-access attempts delay breach discovery beyond the notification deadlines; OCR penalties up to ~$2.1M per violation category per year.",
  severity: "MEDIUM",
  title: "Failed or denied PHI access not recorded for security monitoring",
  description:
    "Detects authorization/authentication failures on PHI access paths that are returned (403/401) or caught without writing a security-event record — including empty `catch` blocks around PHI reads and `if (!authorized) return 403` branches with no `auditLog`/security-log call capturing the failed attempt.",
  codePatterns: [
    "catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}",
    "if\\s*\\(\\s*!?\\s*(authorized|allowed|canAccess|hasAccess|isOwner)[^)]*\\)\\s*\\{?\\s*return[^;]*(401|403|forbidden|unauthorized)",
    "return\\s+new\\s+Response\\([^)]*\\b(401|403)\\b",
  ],
  keywords: [
    "403",
    "401",
    "unauthorized",
    "forbidden",
    "denied",
    "authorized",
    "auditLog",
    "securityLog",
    "failed",
    "monitor",
    "patient",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "if (!canAccess(session.user, patientId)) {\n  return new Response('Forbidden', { status: 403 });\n}",
    "try {\n  return await readPatient(id);\n} catch (e) {}",
  ],
  complianceExamples: [
    "if (!canAccess(session.user, patientId)) {\n  await securityLog.append({ actorId: session.user.id, action: 'phi.access.denied', recordId: patientId, ts: Date.now() });\n  return new Response('Forbidden', { status: 403 });\n}",
    "try {\n  return await readPatient(id);\n} catch (e) {\n  await securityLog.append({ actorId: session.user.id, action: 'phi.access.error', recordId: id, error: String(e) });\n  throw e;\n}",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} rejects or swallows a failed PHI-access attempt without recording it. HIPAA §164.308(a)(1)(ii)(D) and §164.308(a)(5)(ii)(C) require reviewing system activity and monitoring log-in attempts; unlogged denials hide reconnaissance and delay breach detection.",
    fixDescription:
      "Record every denied or failed PHI-access attempt to a security-event/audit store (actor, target record, action, timestamp, outcome) before returning the 401/403, and never swallow exceptions on PHI paths. Feed these events into alerting for repeated failures.",
    fixCodeTemplate:
      "if (!canAccess(session.user, patientId)) {\n  await securityLog.append({\n    actorId: session.user.id,\n    action: 'phi.access.denied',\n    recordId: patientId,\n    ts: Date.now(),\n  });\n  return new Response('Forbidden', { status: 403 });\n}",
    estimatedFixTime: "~1 hour",
    references: [
      "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.308",
      "https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html",
    ],
  },
};
