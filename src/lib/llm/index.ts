// Provider-agnostic LLM facade.
//
// Scanner passes (recon / deep_scan / verify) call `callLlm` and never see
// the underlying vendor. The provider is selected at runtime by the
// `LLM_PROVIDER` env var; today we ship one provider (anthropic), with
// openai-compatible support landing in a follow-up commit. Adding a new
// backend means writing a `providers/<name>.ts` that implements the same
// (messages, options) → LlmCallResult contract and wiring it below.

import { serverEnv } from "@/env";

import { callAnthropic } from "./providers/anthropic";
import type { LlmCallOptions, LlmCallResult, LlmMessage } from "./types";

export type LlmProviderName = "anthropic";

export async function callLlm(
  messages: readonly LlmMessage[],
  options: LlmCallOptions,
): Promise<LlmCallResult> {
  const provider = (serverEnv.LLM_PROVIDER ?? "anthropic") as LlmProviderName;
  switch (provider) {
    case "anthropic":
      return callAnthropic(messages, options);
    default: {
      const exhaustive: never = provider;
      throw new Error(`Unknown LLM_PROVIDER: ${String(exhaustive)}`);
    }
  }
}

export type { LlmCallOptions, LlmCallResult, LlmMessage } from "./types";
export { LlmContractError, LlmRateLimitError, LlmServerError } from "./types";
