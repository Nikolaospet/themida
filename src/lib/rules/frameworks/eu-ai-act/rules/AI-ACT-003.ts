import type { ComplianceRule } from "../../../types";

export const AI_ACT_003: ComplianceRule = {
  id: "AI-ACT-003",
  framework: "eu-ai-act",
  version: "1.0.0",
  article: "Article 53",
  legalText:
    "Providers of general-purpose AI models shall draw up and keep up-to-date the technical documentation of the model, including its training and testing process and the results of its evaluation.",
  legalSource: "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
  legalRisk: "Up to €15,000,000 or 3% of total worldwide annual turnover",
  severity: "MEDIUM",
  title: "GPAI model used without documented capabilities and limitations",
  description:
    "Flags codebases that integrate a general-purpose AI model (Claude, GPT, Gemini, Mistral, Llama) without an accompanying model-card, README section, or `MODEL_CARD.md` describing intended use, evaluation results and known limitations.",
  codePatterns: [
    "anthropic\\.messages\\.create",
    "openai\\.chat\\.completions",
    "google\\.generativelanguage",
    "mistralai\\.client",
    "Llama|llama-2|llama-3|llama2",
  ],
  keywords: ["MODEL_CARD", "model card", "intended use", "limitations", "evaluation"],
  fileTypes: [".md", ".ts", ".js", ".py"],
  violationExamples: ["// project uses claude-sonnet-4-6 — no MODEL_CARD.md anywhere in the repo"],
  complianceExamples: [
    "// docs/MODEL_CARD.md describes intended use, training data, eval results, limitations",
  ],
  findingTemplate: {
    explanation:
      "{{SPECIFIC_CODE}} consumes a general-purpose AI model without supplementary documentation. Article 53 of the EU AI Act requires GPAI providers and downstream deployers to maintain technical documentation describing the model's training, evaluation and intended use.",
    fixDescription:
      "Add a `docs/MODEL_CARD.md` (or README section) covering: (1) intended use, (2) out-of-scope use, (3) the upstream model + version, (4) evaluation results you rely on, (5) known limitations and bias considerations.",
    fixCodeTemplate:
      "# Model Card — Themida Compliance Scanner\n\n## Upstream model\nclaude-sonnet-4-6 + claude-haiku-4-5 (Anthropic).\n\n## Intended use\n... \n\n## Out-of-scope use\n...\n\n## Evaluation\n...\n\n## Limitations\n...\n",
    estimatedFixTime: "Half day",
    references: [
      "https://eur-lex.europa.eu/eli/reg/2024/1689/oj",
      "https://artificialintelligenceact.eu/article/53/",
    ],
  },
};
