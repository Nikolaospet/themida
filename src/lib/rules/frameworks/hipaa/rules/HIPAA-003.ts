import type { ComplianceRule } from "../../../types";

export const HIPAA_003: ComplianceRule = {
  id: "HIPAA-003",
  framework: "hipaa",
  version: "1.0.0",
  article: "45 CFR §164.312(a)(1) Access control, §164.502(b) Minimum necessary",
  legalText:
    "A covered entity must implement technical policies that allow access to ePHI only to those persons or software programs that have been granted access rights, and must make reasonable efforts to limit PHI to the minimum necessary to accomplish the intended purpose. Returning whole patient records (`SELECT *`, unscoped `findMany`) to a caller violates both access control and the minimum-necessary standard.",
  legalSource:
    "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
  legalRisk:
    "Over-broad PHI disclosure is among the most-cited HIPAA violations; civil money penalties up to ~$2.1M per violation category per year.",
  severity: "HIGH",
  title: "Patient data returned without access scoping or minimum-necessary field selection",
  description:
    "Detects PHI queries that read entire records or whole tables — `SELECT *` against a patient/PHI table, an unscoped `findMany()`/`scan()` over patients, or a handler returning the full patient row to the client — without a role/relationship access check or an explicit minimum-necessary field projection.",
  codePatterns: [
    "SELECT\\s+\\*\\s+FROM\\s+\\w*(patient|phi|medical|health|ehr|record)",
    "(patient|phi|medical|record)s?\\.(findMany|scan|all)\\s*\\(\\s*\\)",
    "Response\\.json\\(\\s*patient\\s*\\)",
  ],
  keywords: [
    "SELECT *",
    "findMany",
    "minimum necessary",
    "patient",
    "select",
    "scope",
    "role",
    "rbac",
    "consent",
    "fields",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php", ".sql"],
  violationExamples: [
    "const patient = await db.patient.findUnique({ where: { id } });\nreturn Response.json(patient);",
    "const rows = await pool.query('SELECT * FROM patients');",
  ],
  complianceExamples: [
    "const patient = await db.patient.findUnique({\n  where: { id },\n  select: { id: true, displayName: true },\n});\nif (!careTeam.includes(session.user.id)) return forbidden();\nreturn Response.json(patient);",
    "const rows = await pool.query('SELECT id, display_name FROM patients WHERE clinic_id = $1', [clinicId]);",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} exposes more PHI than the caller needs and without an access check. HIPAA §164.312(a)(1) limits ePHI access to authorized programs/users, and §164.502(b) requires disclosing only the minimum necessary — returning whole records or whole tables breaches both.",
    fixDescription:
      "Project only the fields the caller needs (avoid `SELECT *` and full-row returns), and gate the query on the authenticated user's relationship to the patient (care team, clinic/tenant scope, role). Centralize the access decision so it cannot be skipped per-endpoint.",
    fixCodeTemplate:
      "const patient = await db.patient.findUnique({\n  where: { id },\n  select: { id: true, displayName: true },\n});\nif (!patient || !careTeam.has(patient.id, session.user.id)) {\n  return new Response('Not found', { status: 404 });\n}\nreturn Response.json(patient);",
    estimatedFixTime: "~1 hour",
    references: [
      "https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C/section-164.312",
      "https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/minimum-necessary-requirement/index.html",
    ],
  },
};
