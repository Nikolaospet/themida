import type { ComplianceRule } from "../../../types";

export const MICA_004: ComplianceRule = {
  id: "MICA-004",
  framework: "mica",
  version: "1.0.0",
  article: "Article 68, Article 75",
  legalText:
    "A crypto-asset service provider that provides custody and administration of crypto-assets on behalf of clients shall keep a register of positions, opened in the name of each client, corresponding to each client's rights to the crypto-assets, and shall record any movement in accordance with their clients' instructions.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
  legalRisk: "Up to 5% of total annual turnover or €700,000; supervisory sanctions",
  severity: "HIGH",
  title: "Custody event logged via console/logger without an immutable audit record",
  description:
    "Detects deposit, withdrawal, or custody-state changes recorded only with a stdlib logger (`console.log`, `logger.info`, `pino.info`) and no call to an audit-log / append-only store. MiCA Article 68 requires CASPs to keep a register of positions and movements per client that survives operational logger retention.",
  codePatterns: [
    "(console|logger|pino|log)\\.(log|info|debug|trace)\\([^)]*(deposit|withdraw|custody|holding|balance)",
    "(console|logger|pino|log)\\.(log|info|debug|trace)\\([^)]*(redeem|mint|burn)\\(.*token",
  ],
  keywords: [
    "deposit",
    "withdraw",
    "custody",
    "auditLog",
    "auditTrail",
    "appendOnly",
    "ledger",
    "immutable",
    "register",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".go"],
  violationExamples: [
    "logger.info({ clientId, amount }, 'withdraw processed');",
    "console.log(`deposit confirmed for ${clientId}: ${amount} USDT`);",
  ],
  complianceExamples: [
    "await auditLog.append({ event: 'withdraw', clientId, amount, txHash, ts: Date.now() });\nlogger.info({ clientId, amount }, 'withdraw processed');",
    "await ledger.recordMovement({ kind: 'deposit', clientId, amount, asset, sourceTxHash });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} records a custody event using the regular application logger, which is typically rotated and aggregated for observability rather than retained as an immutable per-client register. MiCA Article 68 obliges a CASP to maintain a register of positions and movements per client, sufficient to reconstruct each client's rights in case of dispute or insolvency.",
    fixDescription:
      "Pair every custody-state change with a call to an append-only audit log (database table with `INSERT`-only privileges, or a tamper-evident ledger). The regular logger can stay for ops visibility, but it must not be the system of record.",
    fixCodeTemplate:
      "await auditLog.append({\n  event: 'withdraw',\n  clientId,\n  asset,\n  amount,\n  txHash,\n  initiatedBy: req.user.id,\n  ts: Date.now(),\n});\nlogger.info({ clientId, amount }, 'withdraw processed');",
    estimatedFixTime: "1-2 hours",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
      "https://www.esma.europa.eu/sites/default/files/2024-03/ESMA75-453128700-1003_Final_Report_MiCA_RTS_CASP_safekeeping.pdf",
    ],
  },
};
