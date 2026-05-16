// @vitest-environment node
import { describe, expect, it } from "vitest";

import { parseProgress, type ScanProgress, serializeProgress } from "./progress";

describe("scanner/progress", () => {
  it("serializes a queued phase to a plain object", () => {
    const p: ScanProgress = { phase: "queued" };
    expect(serializeProgress(p)).toEqual({ phase: "queued" });
  });

  it("serializes deep_scan with file counter", () => {
    const p: ScanProgress = { phase: "deep_scan", filesDone: 12, filesTotal: 30 };
    expect(serializeProgress(p)).toEqual({
      phase: "deep_scan",
      files_done: 12,
      files_total: 30,
    });
  });

  it("parses a snake_case payload from the database", () => {
    expect(parseProgress({ phase: "deep_scan", files_done: 5, files_total: 20 })).toEqual({
      phase: "deep_scan",
      filesDone: 5,
      filesTotal: 20,
    });
  });

  it("defaults to queued when payload is empty", () => {
    expect(parseProgress({})).toEqual({ phase: "queued" });
  });

  it("rejects unknown phases", () => {
    expect(() => parseProgress({ phase: "exploding" })).toThrow(/invalid phase/i);
  });
});
