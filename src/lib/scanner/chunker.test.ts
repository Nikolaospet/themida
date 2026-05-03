import { describe, expect, it } from "vitest";

import { chunkFiles, estimateTokens } from "./chunker";
import type { ScannerFile } from "./types";

const f = (path: string, content: string): ScannerFile => ({
  path,
  size: content.length,
  content,
});

describe("estimateTokens", () => {
  it("approximates 1 token per 4 characters", () => {
    expect(estimateTokens("aaaa")).toBe(1);
    expect(estimateTokens("aaaaaaaa")).toBe(2);
    expect(estimateTokens("")).toBe(0);
  });

  it("rounds up partial tokens", () => {
    expect(estimateTokens("aaa")).toBe(1);
  });
});

describe("chunkFiles", () => {
  it("returns one chunk when total tokens fit the budget", () => {
    const files: ScannerFile[] = [f("a.ts", "abcd".repeat(10)), f("b.ts", "abcd".repeat(10))];
    const chunks = chunkFiles(files, { maxTokensPerChunk: 1000 });
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toHaveLength(2);
  });

  it("splits files across chunks once the budget is full", () => {
    const files: ScannerFile[] = [
      f("a.ts", "x".repeat(4000)),
      f("b.ts", "x".repeat(4000)),
      f("c.ts", "x".repeat(4000)),
    ];
    const chunks = chunkFiles(files, { maxTokensPerChunk: 1500 });
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      const total = chunk.reduce((acc, file) => acc + estimateTokens(file.content ?? ""), 0);
      expect(total).toBeLessThanOrEqual(1500 + 1000);
    }
  });

  it("places oversized files in their own chunk", () => {
    const files: ScannerFile[] = [
      f("normal.ts", "x".repeat(400)),
      f("huge.ts", "x".repeat(20_000)),
    ];
    const chunks = chunkFiles(files, { maxTokensPerChunk: 1000 });
    const hugeChunk = chunks.find((c) => c.some((file) => file.path === "huge.ts"));
    expect(hugeChunk).toBeDefined();
    expect(hugeChunk).toHaveLength(1);
  });

  it("handles an empty list", () => {
    expect(chunkFiles([], { maxTokensPerChunk: 1000 })).toEqual([]);
  });

  it("treats files without content as zero tokens", () => {
    const files: ScannerFile[] = [
      { path: "a.ts", size: 0 },
      { path: "b.ts", size: 0 },
    ];
    expect(chunkFiles(files, { maxTokensPerChunk: 1000 })).toHaveLength(1);
  });
});
