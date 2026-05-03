import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const environment = process.env.SENTRY_ENVIRONMENT ?? "development";

if (dsn) {
  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: environment === "production" ? 0.2 : 1.0,
    sendDefaultPii: false,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,
    enabled: process.env.NODE_ENV === "production" || Boolean(process.env.SENTRY_FORCE_ENABLE),
  });
}
