import type { Pass, Provider } from "@/lib/observability/cost-tracker";

export type LlmRole = "system" | "user";

export type LlmMessage = {
  readonly role: LlmRole;
  readonly content: string;
};

export type LlmCallOptions = {
  readonly pass: Pass;
  readonly scanId?: string | null;
  readonly userId?: string | null;
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly abortSignal?: AbortSignal;
};

export type LlmCallResult = {
  readonly text: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly durationMs: number;
  readonly requestId: string;
  readonly model: string;
  readonly provider: Provider;
};

export class LlmRateLimitError extends Error {
  override readonly name = "LlmRateLimitError";
  readonly retryAfterMs: number;

  constructor(message: string, retryAfterMs: number) {
    super(message);
    this.retryAfterMs = retryAfterMs;
  }
}

export class LlmServerError extends Error {
  override readonly name = "LlmServerError";
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export class LlmContractError extends Error {
  override readonly name = "LlmContractError";
  constructor(message: string) {
    super(message);
  }
}
