import type { ComplianceRule } from "../../../types";

export const GDPR_004: ComplianceRule = {
  id: "GDPR-004",
  framework: "gdpr",
  version: "1.0.0",
  article: "Article 6, Article 7",
  legalText:
    "Where processing is based on consent, the controller shall be able to demonstrate that the data subject has consented to processing of his or her personal data.",
  legalSource: "https://gdpr-info.eu/art-7-gdpr/",
  legalRisk: "Up to €20,000,000 or 4% of total worldwide annual turnover",
  severity: "MEDIUM",
  title: "Consent gathered with a pre-checked box",
  description:
    "Detects HTML / JSX forms where the marketing or tracking consent checkbox is initialised to checked / true, violating Article 7's requirement that consent be unambiguous and freely given.",
  codePatterns: [
    "<input[^>]*type=[\\'\"]checkbox[\\'\"][^>]*name=[\\'\"](marketing|consent|newsletter)",
    "<input[^>]*name=[\\'\"](marketing|consent|newsletter)[^>]*type=[\\'\"]checkbox[\\'\"]",
  ],
  keywords: ["checkbox", "consent", "marketing", "newsletter", "checked", "defaultChecked"],
  fileTypes: [".tsx", ".jsx", ".html", ".vue", ".svelte"],
  violationExamples: [
    '<input type="checkbox" name="marketing" defaultChecked />',
    '<input type="checkbox" name="consent" checked />',
  ],
  complianceExamples: [
    '<input type="checkbox" name="marketing" />',
    "const [marketing, setMarketing] = useState(false);",
  ],
  findingTemplate: {
    explanation:
      "The consent checkbox at {{SPECIFIC_CODE}} starts in the checked state. Article 7(2) of the GDPR requires that consent be a clear, affirmative act; pre-ticked boxes are explicitly invalid (recital 32).",
    fixDescription:
      "Initialise the checkbox unchecked. The user must take a positive action to opt in.",
    fixCodeTemplate: '<input type="checkbox" name="marketing" />',
    estimatedFixTime: "~15 minutes",
    references: ["https://gdpr-info.eu/art-7-gdpr/", "https://gdpr-info.eu/recitals/no-32/"],
  },
};
