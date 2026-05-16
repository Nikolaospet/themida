// Provider-agnostic LLM facade.
//
// Scanner passes (recon / deep_scan / verify) call `callLlm` and never see
// the underlying vendor. The provider is selected at runtime by the
// `LLM_PROVIDER` env var.
//
// Adding a new backend:
//   1. Drop a `providers/<name>.ts` that exports a function with the
//      (messages, options) → Promise<LlmCallResult> shape.
//   2. Extend the `LLM_PROVIDER` enum in `src/env.ts`.
//   3. Add a case below. That's it — scanner code stays untouched.

import { serverEnv } from "@/env";

import { callAnthropic } from "./providers/anthropic";
import { callOpenAI } from "./providers/openai";
import type { LlmCallOptions, LlmCallResult, LlmMessage } from "./types";

export type LlmProviderName = "anthropic" | "openai";

export async function callLlm(
  messages: readonly LlmMessage[],
  options: LlmCallOptions,
): Promise<LlmCallResult> {
  const provider = (serverEnv.LLM_PROVIDER ?? "anthropic") as LlmProviderName;
  switch (provider) {
    case "anthropic":
      return callAnthropic(messages, options);
    case "openai":
      return callOpenAI(messages, options);
    default: {
      const exhaustive: never = provider;
      throw new Error(`Unknown LLM_PROVIDER: ${String(exhaustive)}`);
    }
  }
}

export type { LlmCallOptions, LlmCallResult, LlmMessage } from "./types";
export { LlmContractError, LlmRateLimitError, LlmServerError } from "./types";
