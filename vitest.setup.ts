import "@testing-library/jest-dom/vitest";

// Inject placeholders for env vars that production requires but unit tests
// don't actually exercise (no real Trigger.dev / Stripe / Resend calls in
// unit tests). Real values from .env.local still take precedence — see
// vitest.config.ts which calls loadEnvLocal() before this file runs.
const TEST_ENV_DEFAULTS: Record<string, string> = {
  TRIGGER_PROJECT_REF: "proj_test_placeholder",
};
for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}
