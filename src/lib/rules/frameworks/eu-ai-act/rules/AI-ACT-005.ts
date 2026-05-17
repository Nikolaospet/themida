import type { ComplianceRule } from "../../../types";

export const AI_ACT_005: ComplianceRule = {
  id: "AI-ACT-005",
  framework: "eu-ai-act",
  version: "1.0.0",
  article: "Article 5(1)(f)",
  legalText:
    "The placing on the market, the putting into service for this specific purpose, or the use of AI systems to infer emotions of a natural person in the areas of workplace and education institutions shall be prohibited.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  legalRisk: "Up to €35,000,000 or 7% of total worldwide annual turnover",
  severity: "CRITICAL",
  title: "Emotion-recognition AI used in workplace or education context",
  description:
    "Flags imports of emotion-recognition libraries or API calls (`detect_emotion`, `face_emotion`, sentiment-from-camera) when the surrounding code references HR / employee / student / classroom contexts.",
  codePatterns: [
    "detect_?emotion",
    "face[-_]?emotion",
    "sentiment.*camera",
    "(employee|hr|student|classroom).*emotion",
  ],
  keywords: ["emotion", "sentiment", "employee", "student", "classroom", "hr", "workplace"],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py"],
  violationExamples: [
    "const mood = await detectEmotion(employeeWebcamFrame);",
    "if (student.classroomMood === 'distracted') alertTeacher();",
  ],
  complianceExamples: [
    "// emotion recognition disabled in workplace/education — see compliance/eu-ai-act.md",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} performs emotion recognition in a workplace or education context. Article 5(1)(f) of the EU AI Act prohibits the placing on the market and use of AI systems that infer emotions of natural persons in those settings, with very narrow exceptions for medical / safety reasons.",
    fixDescription:
      "Remove the emotion-recognition pipeline from the workplace/education flow, or document the safety/medical exception under Article 5(1)(f) with legal sign-off and surface that documentation in the code path.",
    fixCodeTemplate:
      "// Emotion recognition removed — Article 5(1)(f) of the EU AI Act prohibits this in workplace/education contexts.",
    estimatedFixTime: "Half day",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      "https://artificialintelligenceact.eu/article/5/",
    ],
  },
};
