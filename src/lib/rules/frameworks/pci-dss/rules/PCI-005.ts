import type { ComplianceRule } from "../../../types";

export const PCI_005: ComplianceRule = {
  id: "PCI-005",
  framework: "pci-dss",
  version: "1.0.0",
  article:
    "PCI DSS v4.0 Requirements 2.2.2 / 8.3.1 — Vendor default accounts and credentials are removed or changed",
  legalText:
    "Vendor default accounts are managed: removed or disabled if not used, or the default password is changed and use is required only as needed. Authentication is enforced with strong factors, and access is never granted by a default or hardcoded password. Shipping code that connects with a vendor default account (`admin`/`admin`, `root`/`root`, empty password) or a hardcoded administrative credential leaves the cardholder data environment trivially accessible.",
  legalSource: "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
  legalRisk:
    "Vendor default and hardcoded credentials are among the most exploited entry points into card data environments; their presence is an automatic compliance failure and a leading root cause of card breaches.",
  severity: "HIGH",
  title: "Vendor default or hardcoded credentials used to access the environment",
  description:
    "Detects authentication configured with vendor default or hardcoded credentials — `user: 'admin', password: 'admin'`, `root`/`root`, an empty password, or a hardcoded `password`/`adminPassword` literal in a DB/service connection — instead of changed, secret-managed credentials as PCI DSS Req 2.2.2/8.3.1 require.",
  codePatterns: [
    "(user(name)?|login)\\s*[:=]\\s*[`'\"](admin|root|sa|postgres)[`'\"][^\\n]{0,40}(pass(word)?|pwd)\\s*[:=]\\s*[`'\"](admin|root|password|changeme|)[`'\"]",
    "(password|passwd|pwd|adminPassword|dbPassword)\\s*[:=]\\s*[`'\"](admin|root|password|changeme|123456|default)[`'\"]",
    "(password|pwd)\\s*[:=]\\s*[`'\"][`'\"]",
  ],
  keywords: [
    "admin",
    "root",
    "default",
    "password",
    "changeme",
    "credentials",
    "vendor default",
    "hardcoded",
    "secret",
    "rotate",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go", ".php", ".yml", ".yaml", ".env"],
  violationExamples: [
    "const db = createPool({ host, user: 'admin', password: 'admin', database: 'payments' });",
    "const adminPassword = 'changeme';",
  ],
  complianceExamples: [
    "const db = createPool({ host, user: process.env.DB_USER, password: await secrets.get('db/password'), database: 'payments' });",
    "const adminPassword = await secrets.get('admin/password');",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} authenticates with a vendor default or hardcoded credential. PCI DSS Req 2.2.2 requires vendor default accounts to be removed or their passwords changed, and Req 8.3.1 forbids access via default/hardcoded passwords — defaults like admin/admin or an empty password give an attacker direct access to the cardholder data environment.",
    fixDescription:
      "Remove or disable unused vendor default accounts and change all default passwords before deployment. Load service credentials from a secrets manager at runtime, enforce strong unique passwords (and MFA for interactive admin access), and rotate any credential that was ever hardcoded.",
    fixCodeTemplate:
      "const db = createPool({\n  host,\n  user: process.env.DB_USER,\n  password: await secrets.get('db/password'),\n  database: 'payments',\n});",
    estimatedFixTime: "~1 hour",
    references: [
      "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0.pdf",
      "https://www.pcisecuritystandards.org/document_library/",
    ],
  },
};
