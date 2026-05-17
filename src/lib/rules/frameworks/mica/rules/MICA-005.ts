import type { ComplianceRule } from "../../../types";

export const MICA_005: ComplianceRule = {
  id: "MICA-005",
  framework: "mica",
  version: "1.0.0",
  article: "Article 92, Article 88, Article 89",
  legalText:
    "Persons professionally arranging or executing transactions in crypto-assets shall have in place effective arrangements, systems and procedures to prevent and detect market abuse. Any person who reasonably suspects that an order or transaction in any crypto-asset could constitute insider dealing, market manipulation or an attempt thereof, shall notify the competent authority without delay.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
  legalRisk: "Up to 15% of total annual turnover or €15,000,000 for market abuse breaches",
  severity: "HIGH",
  title: "Order execution path missing market-abuse detection hook",
  description:
    "Detects order-execution or matching-engine entry points that commit a trade without calling a market-abuse / suspicious-transaction detector. Article 92 of MiCA obliges persons arranging or executing crypto-asset transactions to maintain effective detection arrangements; without a detector hook on the hot path, suspicious activity reporting (STOR) becomes a manual after-the-fact process.",
  codePatterns: [
    "(executeOrder|matchOrder|placeOrder|placeTrade|fillOrder|settleTrade)\\s*\\(",
    "(orderBook|matchingEngine)\\.(execute|match|fill)\\(",
  ],
  keywords: [
    "executeOrder",
    "matchingEngine",
    "marketAbuse",
    "suspicious",
    "STOR",
    "reportSuspicious",
    "abuseMonitor",
    "wash trading",
    "front running",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".go"],
  violationExamples: [
    "export async function executeOrder(order: Order) {\n  await orderBook.match(order);\n  await settlement.settle(order);\n}",
    "await matchingEngine.fill(order); // no surveillance hook",
  ],
  complianceExamples: [
    "export async function executeOrder(order: Order) {\n  const verdict = await marketAbuseMonitor.assess(order);\n  if (verdict.flag === 'block') throw new MarketAbuseError(verdict.reason);\n  if (verdict.flag === 'report') await stor.queueSuspicious(order, verdict);\n  await orderBook.match(order);\n  await settlement.settle(order);\n}",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} matches or settles an order without invoking a market-abuse / suspicious-transaction detector. MiCA Article 92 obliges persons professionally arranging or executing crypto-asset transactions to maintain effective arrangements to prevent and detect market abuse, and Article 92(4) requires suspicious orders/transactions to be reported to the competent authority without delay.",
    fixDescription:
      "Wrap every order-execution entry point in a surveillance pass that classifies the order (`pass`, `report`, `block`). Route `report` outputs to a Suspicious Transaction and Order Report (STOR) queue and surface `block` as a synchronous error so the trade never reaches settlement.",
    fixCodeTemplate:
      "export async function executeOrder(order: Order) {\n  const verdict = await marketAbuseMonitor.assess(order);\n  if (verdict.flag === 'block') throw new MarketAbuseError(verdict.reason);\n  if (verdict.flag === 'report') await stor.queueSuspicious(order, verdict);\n  await orderBook.match(order);\n  await settlement.settle(order);\n}",
    estimatedFixTime: "Half day",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
      "https://www.esma.europa.eu/sites/default/files/2024-03/ESMA75-453128700-1100_Final_Report_MiCA_RTS_market_abuse.pdf",
    ],
  },
};
