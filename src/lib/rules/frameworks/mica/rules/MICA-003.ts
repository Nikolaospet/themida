import type { ComplianceRule } from "../../../types";

export const MICA_003: ComplianceRule = {
  id: "MICA-003",
  framework: "mica",
  version: "1.0.0",
  article: "Article 70, Article 75",
  legalText:
    "A crypto-asset service provider that holds clients' crypto-assets shall make adequate arrangements to safeguard the ownership rights of clients, especially in the event of the crypto-asset service provider's insolvency, and to prevent the use of clients' crypto-assets on its own account.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
  legalRisk: "Up to 5% of total annual turnover or €700,000; restitution liability",
  severity: "CRITICAL",
  title: "Client crypto-assets transferred without segregation marker",
  description:
    "Detects wallet or account transfer code that moves a client's crypto-assets without an explicit segregation flag (`clientId`, `omnibus`, `segregated`, or equivalent). Article 70 of MiCA requires CASPs to keep client assets segregated from their own and to maintain records distinguishing each client's holdings.",
  codePatterns: [
    "wallet\\.(transfer|send|sendTransaction|withdraw)\\(",
    "(transferAsset|transferToken|sendToken|moveFunds)\\(",
    "ethers\\.Wallet\\([^)]*\\)\\.send",
    "web3\\.eth\\.sendTransaction\\(",
  ],
  keywords: [
    "wallet",
    "transfer",
    "withdraw",
    "custody",
    "client",
    "segregated",
    "omnibus",
    "clientId",
    "subaccount",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rs", ".go"],
  violationExamples: [
    "await wallet.transfer({ to: req.body.address, amount: req.body.amount });",
    "await web3.eth.sendTransaction({ from: HOT_WALLET, to: req.body.dest, value });",
  ],
  complianceExamples: [
    "await wallet.transfer({ from: clientSubaccount(req.user.id), to: req.body.address, amount, segregation: 'client' });",
    "await custody.withdrawForClient({ clientId: req.user.id, asset, amount, omnibus: false });",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} executes a crypto-asset transfer without a visible per-client segregation marker. MiCA Article 70 forbids a CASP from using clients' crypto-assets on its own account, and Article 75 requires record-keeping that distinguishes each client's holdings. A transfer that does not carry a `clientId` (or equivalent subaccount identifier) cannot be reconciled in an insolvency scenario.",
    fixDescription:
      "Route every client transfer through a function that takes the client identifier (or per-client subaccount) and records the segregation tier (`client` vs. `house`, `omnibus` vs. `dedicated`). Persist the link between the on-chain transaction hash and the client subaccount in an immutable audit log.",
    fixCodeTemplate:
      "await custody.transferForClient({\n  clientId: req.user.id,\n  asset: req.body.asset,\n  amount: req.body.amount,\n  to: req.body.address,\n  segregation: 'client',  // 'house' is forbidden for client-instructed transfers\n});",
    estimatedFixTime: "Half day",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2023/1114/oj",
      "https://www.esma.europa.eu/sites/default/files/2024-03/ESMA75-453128700-1003_Final_Report_MiCA_RTS_CASP_safekeeping.pdf",
    ],
  },
};
