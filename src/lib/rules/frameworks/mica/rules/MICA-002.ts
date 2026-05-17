import type { ComplianceRule } from "../../../types";

export const MICA_002: ComplianceRule = {
  id: "MICA-002",
  framework: "mica",
  version: "1.0.0",
  article: "Article 6, Article 14, Article 17",
  legalText:
    "An offeror or person seeking admission to trading of a crypto-asset, other than an asset-referenced token or e-money token, shall draw up a crypto-asset white paper that includes the information set out in Article 6 and shall publish it. The crypto-asset white paper shall not be misleading.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
  legalRisk: "Up to 5% of total annual turnover or €700,000",
  severity: "MEDIUM",
  title: "Crypto-asset whitepaper referenced without integrity metadata",
  description:
    "Detects token metadata or registration code that points at a whitepaper URL without recording the published version and integrity hash. Without a pinned hash, the consumer cannot verify the whitepaper they read matches the one filed with the competent authority.",
  codePatterns: [
    "whitepaper[Uu]rl\\s*[:=]\\s*[\\'\"]https?://",
    "white[_-]?paper\\s*[:=]\\s*[\\'\"]https?://",
    "whitepaper\\s*[:=]\\s*\\{[^}]*url",
  ],
  keywords: [
    "whitepaper",
    "whitepaperUrl",
    "white_paper",
    "whitepaperHash",
    "whitepaperVersion",
    "integrity",
    "sha256",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".json"],
  violationExamples: [
    "export const TOKEN_METADATA = { name: 'ACME', whitepaperUrl: 'https://acme.io/whitepaper.pdf' };",
    'const token = { ticker: "ACME", whitepaper: "https://example.com/wp.pdf" };',
  ],
  complianceExamples: [
    "export const TOKEN_METADATA = {\n  name: 'ACME',\n  whitepaper: {\n    url: 'https://acme.io/whitepaper.v2.pdf',\n    version: '2.0.0',\n    sha256: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',\n  },\n};",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} references the crypto-asset whitepaper by URL alone. MiCA Article 6 and Article 14 require the published whitepaper to be the single authoritative document; without a version and integrity hash next to the URL, a silent edit of the hosted PDF would diverge from the document filed with the competent authority.",
    fixDescription:
      "Replace the plain `whitepaperUrl` field with a structured `whitepaper` object that records the URL, the published version (semver or date), and a SHA-256 of the PDF bytes. Verify the hash on every fetch in code paths that consume the whitepaper.",
    fixCodeTemplate:
      "export const TOKEN_METADATA = {\n  name: 'ACME',\n  whitepaper: {\n    url: 'https://acme.io/whitepaper.v2.pdf',\n    version: '2.0.0',\n    sha256: 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9',\n  },\n};",
    estimatedFixTime: "1-2 hours",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
      "https://www.esma.europa.eu/sites/default/files/2024-03/ESMA75-453128700-933_Final_Report_MiCA_RTS_CASP_white_paper.pdf",
    ],
  },
};
