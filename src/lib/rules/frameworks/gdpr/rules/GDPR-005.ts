import type { ComplianceRule } from "../../../types";

export const GDPR_005: ComplianceRule = {
  id: "GDPR-005",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 44, Article 46",
  legalText:
    "Any transfer of personal data which are undergoing processing or are intended for processing after transfer to a third country shall take place only if the conditions laid down in this Chapter are complied with.",
  legalSource: "https://gdpr-info.eu/art-44-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "HIGH",
  title: "Personal data sent to non-EU third party without safeguards",
  description:
    "Flags client-side or server-side calls to common analytics / telemetry SaaS endpoints (Google Analytics, Mixpanel, Segment, Amplitude) that imply transfer of identifiable user data to non-EU controllers without visible Standard Contractual Clauses or DPA.",
  codePatterns: [
    "google-analytics\\.com",
    "googletagmanager\\.com",
    "api\\.mixpanel\\.com",
    "api\\.segment\\.io",
    "api2\\.amplitude\\.com",
  ],
  keywords: ["analytics", "tracking", "mixpanel", "segment", "amplitude", "datadog"],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".html"],
  violationExamples: [
    "fetch('https://api.mixpanel.com/track', { body: JSON.stringify({ user_id, email }) })",
    '<script src="https://www.googletagmanager.com/gtag/js?id=..." />',
  ],
  complianceExamples: [
    "// EU-hosted analytics (e.g. Plausible self-hosted, Pirsch, Umami) requires no SCC",
    "fetch('https://stats.example.eu/api/event', { body: ... })",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} sends data to a non-EU controller. Articles 44 and 46 of the GDPR require Standard Contractual Clauses, an adequacy decision, or another lawful transfer mechanism for personal data leaving the EEA.",
    fixDescription:
      "Either (a) sign and document SCCs / DPA with the provider and link them in your privacy policy, (b) switch to an EU-hosted analytics provider, or (c) anonymise the payload before it leaves the browser/server.",
    fixCodeTemplate:
      "// EU-hosted alternative\nawait fetch('https://stats.example.eu/api/event', {\n  method: 'POST',\n  body: JSON.stringify({ event: 'pageview' }),\n});",
    estimatedFixTime: "Half day",
    references: [
      "https://gdpr-info.eu/art-44-gdpr/",
      "https://gdpr-info.eu/art-46-gdpr/",
      "https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection_en",
    ],
  },
};
