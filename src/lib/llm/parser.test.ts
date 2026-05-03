// @vitest-environment node
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { LlmJsonParseError, parseStrictJson } from "./parser";

const schema = z.object({ count: z.number() });

describe("parseStrictJson", () => {
  it("parses pure JSON", () => {
    expect(parseStrictJson<{ count: number }>('{"count":3}', schema)).toEqual({ count: 3 });
  });

  it("strips a leading sentence and extracts the first balanced block", () => {
    const result = parseStrictJson<{ count: number }>(
      'Sure! Here it is: {"count": 42} — let me know.',
      schema,
    );
    expect(result.count).toBe(42);
  });

  it("strips markdown code fences", () => {
    const result = parseStrictJson<{ count: number }>('```json\n{"count": 7}\n```', schema);
    expect(result.count).toBe(7);
  });

  it("handles nested braces inside string values", () => {
    const wrapping = z.object({ note: z.string() });
    const result = parseStrictJson<{ note: string }>(
      '{"note": "use {curly} braces inside"}',
      wrapping,
    );
    expect(result.note).toBe("use {curly} braces inside");
  });

  it("throws LlmJsonParseError when nothing parses", () => {
    expect(() => parseStrictJson("no json at all", schema)).toThrow(LlmJsonParseError);
  });

  it("throws LlmJsonParseError when JSON is valid but the schema fails", () => {
    expect(() => parseStrictJson('{"count": "not-a-number"}', schema)).toThrow(LlmJsonParseError);
  });

  it("attaches the offending raw text to the error", () => {
    try {
      parseStrictJson("totally not json", schema);
    } catch (err) {
      expect(err).toBeInstanceOf(LlmJsonParseError);
      expect((err as LlmJsonParseError).rawText).toBe("totally not json");
      return;
    }
    throw new Error("expected parseStrictJson to throw");
  });
});
