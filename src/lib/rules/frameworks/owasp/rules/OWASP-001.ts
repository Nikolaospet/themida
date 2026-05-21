import type { ComplianceRule } from "../../../types";

export const OWASP_001: ComplianceRule = {
  id: "OWASP-001",
  framework: "owasp",
  version: "1.0.0",
  article: "OWASP Top 10:2021 — A01 Broken Access Control",
  legalText:
    "Access control enforces policy such that users cannot act outside of their intended permissions. Failures typically lead to unauthorized information disclosure, modification, or destruction of data. A common weakness is insecure direct object reference (IDOR): an endpoint fetches or mutates a record using an identifier taken straight from the request without verifying the authenticated user is allowed to access that record.",
  legalSource: "https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
  legalRisk:
    "Account takeover and cross-tenant data exposure. A01 was the most prevalent category in the 2021 Top 10. Not a statutory fine, but a primary root cause of reportable breaches.",
  severity: "CRITICAL",
  title: "Resource fetched by request-supplied id without an ownership check",
  description:
    "Detects a database lookup or mutation keyed on an identifier read directly from request input (`params`, `query`, or body) with no adjacent authorization check that the record belongs to the authenticated user (e.g. comparing `userId`/`ownerId`, a policy/`can()` call, or a tenant scope).",
  codePatterns: [
    "(findUnique|findFirst|findById|findOne|update|delete|deleteOne|updateOne)\\s*\\(\\s*\\{?[^}]*\\bid\\s*:\\s*(req\\.params|params|req\\.query|query|req\\.body|body|ctx\\.params)",
    "WHERE\\s+id\\s*=\\s*\\$\\{?\\s*(req\\.params|params|req\\.query|query)",
  ],
  keywords: [
    "params.id",
    "findUnique",
    "findById",
    "ownerId",
    "userId",
    "req.user",
    "authorize",
    "can(",
    "forbidden",
    "403",
    "tenant",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php"],
  violationExamples: [
    "const invoice = await db.invoice.findUnique({ where: { id: params.id } });\nreturn Response.json(invoice);",
    "app.get('/api/orders/:id', async (req, res) => {\n  const order = await Order.findById(req.params.id);\n  res.json(order);\n});",
  ],
  complianceExamples: [
    "const invoice = await db.invoice.findUnique({ where: { id: params.id } });\nif (!invoice || invoice.ownerId !== session.user.id) return forbidden();\nreturn Response.json(invoice);",
    "app.get('/api/orders/:id', requireAuth, async (req, res) => {\n  const order = await Order.findOne({ _id: req.params.id, userId: req.user.id });\n  if (!order) return res.status(404).end();\n  res.json(order);\n});",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} loads or mutates a record using an id taken from the request without verifying the authenticated user owns that record. This is an insecure direct object reference (IDOR): any authenticated user can read or change another user's data by changing the id.",
    fixDescription:
      "Scope every lookup to the authenticated principal. Either include the owner/tenant id in the query predicate, or load the record and reject (404/403) when its owner does not match the session user. Centralize the check in middleware or a policy helper so new endpoints inherit it.",
    fixCodeTemplate:
      "const record = await db.resource.findUnique({ where: { id: params.id } });\nif (!record || record.ownerId !== session.user.id) {\n  return new Response('Not found', { status: 404 });\n}\nreturn Response.json(record);",
    estimatedFixTime: "~30 minutes",
    references: [
      "https://owasp.org/Top10/A01_2021-Broken_Access_Control/",
      "https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html",
      "https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html",
    ],
  },
};
