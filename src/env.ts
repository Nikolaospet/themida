import { z } from "zod";

const stringNonEmpty = z.string().min(1);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  SUPABASE_SERVICE_ROLE_KEY: stringNonEmpty,
  // LLM provider selection. Switch between the bundled provider
  // implementations. `openai` covers any Chat-Completions-shaped endpoint
  // (OpenAI, OpenRouter, Groq, Together, vLLM, llama.cpp server, Ollama,
  // LiteLLM, …) via OPENAI_BASE_URL.
  LLM_PROVIDER: z.enum(["anthropic", "openai"]).default("anthropic"),

  // Anthropic provider. Required when LLM_PROVIDER=anthropic; otherwise
  // optional so self-hosters on another provider don't have to invent a
  // value.
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  ANTHROPIC_MODEL: stringNonEmpty.default("claude-sonnet-4-6"),

  // OpenAI-compatible provider. Required when LLM_PROVIDER=openai;
  // otherwise optional.
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_BASE_URL: z.string().url().optional().or(z.literal("")).default(""),
  OPENAI_MODEL: stringNonEmpty.default("gpt-4.1-mini"),
  // Header carrying the provider's request id (defaults to OpenAI's
  // `x-request-id`; OpenRouter / vLLM / Groq usually match).
  OPENAI_REQUEST_ID_HEADER: stringNonEmpty.default("x-request-id"),
  // Label written to `llm_api_calls.provider`. Override to mark calls
  // from a particular backend (e.g. "openrouter", "groq", "vllm-local").
  OPENAI_PROVIDER_LABEL: stringNonEmpty.default("openai"),
  GITHUB_CLIENT_ID: stringNonEmpty,
  GITHUB_CLIENT_SECRET: stringNonEmpty,
  STRIPE_SECRET_KEY: stringNonEmpty,
  STRIPE_WEBHOOK_SECRET: stringNonEmpty,
  TRIGGER_SECRET_KEY: stringNonEmpty,
  TRIGGER_PROJECT_REF: stringNonEmpty,
  RESEND_API_KEY: stringNonEmpty,
  TOKEN_ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/u, "TOKEN_ENCRYPTION_KEY must be 64 hex characters (32 bytes)"),
  GITHUB_APP_ID: z.string().regex(/^\d+$/u, "GITHUB_APP_ID must be a numeric string"),
  GITHUB_APP_SLUG: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY: z.string().min(1),
  GITHUB_APP_INSTALL_STATE_SECRET: z
    .string()
    .regex(/^[0-9a-fA-F]{64}$/u, "GITHUB_APP_INSTALL_STATE_SECRET must be 64 hex characters"),
  SENTRY_ENVIRONMENT: z.enum(["development", "preview", "production"]).default("development"),
  SENTRY_AUTH_TOKEN: z.string().optional().default(""),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: stringNonEmpty,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: stringNonEmpty,
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional().or(z.literal("")).default(""),
});

export type ClientEnv = z.infer<typeof clientSchema>;
export type ServerEnv = z.infer<typeof serverSchema>;

const skipValidation =
  process.env.SKIP_ENV_VALIDATION === "true" || process.env.SKIP_ENV_VALIDATION === "1";

function parse<T extends z.ZodTypeAny>(schema: T, values: unknown, label: string): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const formatted = JSON.stringify(z.treeifyError(result.error), null, 2);
    throw new Error(`Invalid ${label} environment variables:\n${formatted}`);
  }
  return result.data;
}

const clientValues = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
};

// Lazy-validated proxies. Validation runs on first property access, never at
// module load. This lets `next build` collect page metadata without all
// runtime secrets present (Vercel injects them at deploy time, CI omits
// them entirely). Set SKIP_ENV_VALIDATION=true to opt out completely.

function makeLazyEnv<T extends z.ZodTypeAny>(
  schema: T,
  values: () => unknown,
  label: string,
): z.infer<T> {
  let cache: z.infer<T> | undefined;
  const stub = Object.create(null) as object;
  const proxy = new Proxy(stub, {
    get(_target, prop) {
      if (skipValidation) {
        return (values() as Record<string, unknown>)[prop as string];
      }
      cache ??= parse(schema, values(), label);
      return (cache as Record<string, unknown>)[prop as string];
    },
  });
  return proxy as z.infer<T>;
}

export const clientEnv = makeLazyEnv(clientSchema, () => clientValues, "client");
export const serverEnv = makeLazyEnv(serverSchema, () => process.env, "server");
