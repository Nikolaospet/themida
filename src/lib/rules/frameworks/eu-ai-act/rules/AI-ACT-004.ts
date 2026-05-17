import type { ComplianceRule } from "../../../types";

export const AI_ACT_004: ComplianceRule = {
  id: "AI-ACT-004",
  framework: "eu-ai-act",
  version: "1.0.0",
  article: "Article 5(1)(h)",
  legalText:
    "The use of real-time remote biometric identification systems in publicly accessible spaces for the purposes of law enforcement shall be prohibited, save for limited and strictly defined exceptions.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  legalRisk: "Up to €35,000,000 or 7% of total worldwide annual turnover",
  severity: "CRITICAL",
  title: "Biometric identification without an explicit lawful basis",
  description:
    "Detects use of facial recognition, fingerprint matching, voice-print or other biometric identification APIs without surrounding code that gates access by an explicit lawful basis or `consent`/`law_enforcement_warrant` flag.",
  codePatterns: [
    "rekognition\\.(searchFaces|compareFaces)",
    "face[-_]?api\\.detect",
    "azure-cognitiveservices-vision-face",
    "biometric|fingerprint|face_match|voice_print",
  ],
  keywords: ["rekognition", "face", "fingerprint", "biometric", "voiceprint", "iris"],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py"],
  violationExamples: [
    "const match = await rekognition.searchFacesByImage({ CollectionId: 'visitors', ... });",
  ],
  complianceExamples: [
    "if (!warrant && !explicitConsent) throw new Error('biometric identification not permitted'); ",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} performs biometric identification without a visible lawful-basis gate. Article 5 of the EU AI Act prohibits real-time remote biometric identification in publicly accessible spaces except under narrowly defined exceptions, and Article 6 requires high-risk AI systems to document a lawful basis.",
    fixDescription:
      "Wrap the call in a lawful-basis check (explicit consent, contractual necessity, or — for law enforcement — a documented warrant). Log the basis with each invocation.",
    fixCodeTemplate:
      "if (!hasExplicitBiometricConsent(user) && !lawfulBasis.warrant) {\n  throw new ForbiddenError('biometric identification requires a lawful basis');\n}\nconst match = await rekognition.searchFacesByImage(...);",
    estimatedFixTime: "1-2 hours",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      "https://artificialintelligenceact.eu/article/5/",
    ],
  },
};
