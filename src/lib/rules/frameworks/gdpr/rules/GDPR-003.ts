import type { ComplianceRule } from "../../../types";

export const GDPR_003: ComplianceRule = {
  id: "GDPR-003",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 17",
  legalText:
    "The data subject shall have the right to obtain from the controller the erasure of personal data concerning him or her without undue delay.",
  legalSource: "https://gdpr-info.eu/art-17-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "HIGH",
  title: "No erasure mechanism for user data",
  description:
    "Flags codebases that expose CRUD endpoints over a user resource but have no DELETE handler or `delete-account` route, leaving data subjects unable to exercise their right to erasure.",
  codePatterns: [
    "router\\.(get|post|put|patch)\\([\\'\"]/users",
    "app\\.(get|post|put|patch)\\([\\'\"]/users",
    "@(Get|Post|Put|Patch)\\([\\'\"]/users",
  ],
  keywords: [
    "users",
    "profile",
    "account",
    "delete account",
    "right to erasure",
    "right to be forgotten",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go"],
  violationExamples: ["router.get('/users/:id', getUser); router.post('/users', createUser);"],
  complianceExamples: [
    "router.delete('/users/:id', deleteUser); router.delete('/me', deleteOwnAccount);",
  ],
  findingTemplate: {
    explanation:
      "The codebase manages user resources but exposes no deletion endpoint. Article 17 of the GDPR grants every data subject the right to obtain erasure of personal data concerning them. {{SPECIFIC_CODE}}",
    fixDescription:
      "Add a `DELETE /me` (or equivalent) endpoint that removes the authenticated user's record and any directly-derived data. Ensure the deletion is hard or pseudonymised, not soft-deleted into a still-readable archive.",
    fixCodeTemplate:
      "router.delete('/me', requireAuth, async (req, res) => {\n  await deleteUserAndDerivedData(req.user.id);\n  res.status(204).end();\n});",
    estimatedFixTime: "1-2 hours",
    references: ["https://gdpr-info.eu/art-17-gdpr/"],
  },
};
