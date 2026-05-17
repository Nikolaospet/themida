import type { ComplianceRule } from "../../../types";

export const MICA_001: ComplianceRule = {
  id: "MICA-001",
  framework: "mica",
  version: "1.0.0",
  article: "Article 6, Article 19, Article 28",
  legalText:
    "All marketing communications relating to a crypto-asset shall be fair, clear and not misleading, and shall be consistent with the information included in the crypto-asset white paper. Marketing communications shall be clearly identifiable as such.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
  legalRisk: "Up to 5% of total annual turnover or €700,000",
  severity: "HIGH",
  title: "Marketing copy promises returns without a risk disclaimer",
  description:
    "Detects user-facing copy or API responses that promote crypto returns (yield, APY, passive income, guaranteed) without the MiCA-required statement that crypto-assets are volatile and the user may lose their funds.",
  codePatterns: [
    "(yield|APY|APR|passive[\\s_-]?income|guaranteed[\\s_-]?return|earn[\\s_-]?crypto|stake[\\s_-]?and[\\s_-]?earn)",
    "[\\'\"]\\s*\\d+(?:\\.\\d+)?\\s*%\\s*(APY|APR|yield|return)",
  ],
  keywords: [
    "yield",
    "APY",
    "APR",
    "passive income",
    "earn",
    "stake",
    "guaranteed",
    "risk",
    "volatile",
    "may lose",
  ],
  fileTypes: [".ts", ".tsx", ".jsx", ".mdx", ".md", ".html"],
  violationExamples: [
    "<h2>Earn 12% APY on USDT — guaranteed returns</h2>",
    "return Response.json({ marketing: 'Stake and earn 15% APR — passive income, no lockup' });",
  ],
  complianceExamples: [
    "<h2>Earn up to 12% APY on USDT</h2>\n<p>Crypto-assets are volatile. Past performance does not guarantee future returns; you may lose the capital you invest.</p>",
    "return Response.json({ marketing: '...', riskDisclaimer: 'Crypto-assets are volatile and you may lose your funds. Not investment advice.' });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} promotes a crypto return without the risk-warning statement MiCA Article 6 and Article 28 require. Marketing communications must be fair, clear, not misleading, and must surface volatility/loss-of-capital language alongside any yield claim.",
    fixDescription:
      "Add a clear, machine-readable risk disclaimer adjacent to every yield or return claim. Persist it in the response payload so client code cannot strip it. The text must mention that the value of crypto-assets may fluctuate and the user may lose all or part of the funds invested.",
    fixCodeTemplate:
      '<h2>Earn up to 12% APY on USDT</h2>\n<p role="note" data-mica-disclosure>\n  Crypto-assets are volatile. The value can fluctuate; you may lose all or part of the capital you invest. Not investment advice.\n</p>',
    estimatedFixTime: "~30 minutes",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
      "https://www.esma.europa.eu/sites/default/files/2024-03/ESMA75-453128700-1099_Final_Report_MiCA_RTS_marketing_communications.pdf",
    ],
  },
};
