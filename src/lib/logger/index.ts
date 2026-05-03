import type { DestinationStream, Logger, LoggerOptions } from "pino";
import pino from "pino";

type CreateLoggerArgs = {
  level?: LoggerOptions["level"];
  pretty?: boolean;
  destination?: DestinationStream;
};

const REDACT_PATHS = [
  "password",
  "token",
  "apiKey",
  "authorization",
  "*.password",
  "*.token",
  "*.apiKey",
  "*.authorization",
  "headers.authorization",
];

export function createLogger(args: CreateLoggerArgs = {}): Logger {
  const level =
    args.level ??
    process.env.LOG_LEVEL ??
    (process.env.NODE_ENV === "production" ? "info" : "debug");

  // Pretty mode is for human-driven dev only. In tests (NODE_ENV=test) we
  // want plain JSON so log assertions are deterministic.
  const usePretty = args.pretty ?? (process.env.NODE_ENV === "development" && !args.destination);

  const options: LoggerOptions = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => ({ level: label }),
    },
    redact: {
      paths: REDACT_PATHS,
      censor: "[REDACTED]",
    },
    ...(usePretty
      ? {
          transport: {
            target: "pino-pretty",
            options: { colorize: true, translateTime: "HH:MM:ss.l" },
          },
        }
      : {}),
  };

  return args.destination ? pino(options, args.destination) : pino(options);
}

let cached: Logger | undefined;

function getDefault(): Logger {
  cached ??= createLogger();
  return cached;
}

export function childLogger(bindings: Record<string, unknown>): Logger {
  return getDefault().child(bindings);
}

export const logger = new Proxy({} as Logger, {
  get(_target, prop) {
    return Reflect.get(getDefault(), prop);
  },
});

export type { Logger } from "pino";
