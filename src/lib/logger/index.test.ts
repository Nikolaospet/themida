// @vitest-environment node
import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { createLogger } from "./index";

function captureLines(): { stream: Writable; lines: string[] } {
  const lines: string[] = [];
  const stream = new Writable({
    write(chunk, _enc, cb) {
      lines.push(chunk.toString().trim());
      cb();
    },
  });
  return { stream, lines };
}

describe("createLogger", () => {
  it("emits valid JSON with the message and level", () => {
    const { stream, lines } = captureLines();
    const logger = createLogger({ level: "info", pretty: false, destination: stream });

    logger.info({ foo: "bar" }, "hello");

    expect(lines).toHaveLength(1);
    const entry = JSON.parse(lines[0] ?? "");
    expect(entry.level).toBe("info");
    expect(entry.msg).toBe("hello");
    expect(entry.foo).toBe("bar");
    expect(typeof entry.time).toBe("string");
  });

  it("respects the configured level", () => {
    const { stream, lines } = captureLines();
    const logger = createLogger({ level: "warn", pretty: false, destination: stream });

    logger.info("hidden");
    logger.warn("shown");

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0] ?? "").msg).toBe("shown");
  });

  it("child loggers preserve parent bindings", () => {
    const { stream, lines } = captureLines();
    const logger = createLogger({ level: "info", pretty: false, destination: stream });
    const child = logger.child({ scanId: "abc" });

    child.info("step");

    const entry = JSON.parse(lines[0] ?? "");
    expect(entry.scanId).toBe("abc");
    expect(entry.msg).toBe("step");
  });

  it("redacts sensitive fields", () => {
    const { stream, lines } = captureLines();
    const logger = createLogger({ level: "info", pretty: false, destination: stream });

    logger.info({ password: "p@ss", token: "tok", nested: { token: "deep" } }, "leak check");

    const entry = JSON.parse(lines[0] ?? "");
    expect(entry.password).toBe("[REDACTED]");
    expect(entry.token).toBe("[REDACTED]");
    expect(entry.nested.token).toBe("[REDACTED]");
  });
});
