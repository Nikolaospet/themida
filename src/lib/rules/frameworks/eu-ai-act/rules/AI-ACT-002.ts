import type { ComplianceRule } from "../../../types";

export const AI_ACT_002: ComplianceRule = {
  id: "AI-ACT-002",
  framework: "eu-ai-act",
  version: "1.0.0",
  article: "Article 14",
  legalText:
    "High-risk AI systems shall be designed and developed in such a way, including with appropriate human-machine interface tools, that they can be effectively overseen by natural persons during the period in which they are in use.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  legalRisk: "Up to €15,000,000 or 3% of total worldwide annual turnover",
  severity: "CRITICAL",
  title: "Automated decision affecting individuals without human-review path",
  description:
    "Detects AI-driven approval/rejection decisions over individuals (loans, hires, admissions, benefits) where the resulting status is set without a documented human-in-the-loop review step.",
  codePatterns: [
    "(approval|approved|reject|rejected|hired|fired|grant|denied)\\s*=\\s*ai",
    "(decision|verdict|outcome)\\s*=\\s*await\\s+(claude|openai|anthropic)",
    "user\\.(approved|status)\\s*=\\s*await\\s+(claude|openai|anthropic|model)",
  ],
  keywords: [
    "approval",
    "decision",
    "applicant",
    "candidate",
    "hire",
    "loan",
    "credit",
    "benefit",
    "eligibility",
  ],
  fileTypes: [".ts", ".tsx", ".js", ".jsx", ".py", ".rb"],
  violationExamples: [
    "applicant.status = decision === 'approve' ? 'hired' : 'rejected'; // decision comes from Claude",
    "const verdict = await openai.chat.completions.create(...); await updateLoanStatus(verdict);",
  ],
  complianceExamples: [
    "await queueForHumanReview(applicantId, aiSuggestion);",
    "if (aiSuggestion.confidence < 0.95 || HUMAN_REVIEW_REQUIRED) await queueForHumanReview(...);",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} commits an AI-suggested decision to the user record without a human-review gate. Article 14 of the EU AI Act requires high-risk AI systems to be effectively overseen by natural persons; decisions affecting an individual's rights or status must remain human-controllable.",
    fixDescription:
      'Persist the AI output as a recommendation, not a final state. Route the decision through a queue or status "pending_review" until a human reviewer confirms.',
    fixCodeTemplate:
      "await db.applicants.update({\n  id: applicantId,\n  data: { ai_suggestion: decision, status: 'pending_review' },\n});\nawait notifyReviewer(applicantId);",
    estimatedFixTime: "Half day",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      "https://artificialintelligenceact.eu/article/14/",
    ],
  },
};
