import type { z, ZodIssue, ZodTypeAny } from "zod";

export class LlmJsonParseError extends Error {
  override readonly name = "LlmJsonParseError";
  readonly rawText: string;
  readonly zodIssues: readonly ZodIssue[];

  constructor(message: string, rawText: string, zodIssues: readonly ZodIssue[] = []) {
    super(message);
    this.rawText = rawText;
    this.zodIssues = zodIssues;
  }
}

/**
 * Parses an LLM response into a typed value.
 *
 * Steps:
 *   1. Strip surrounding markdown code fences (```json ... ```).
 *   2. Extract the first balanced { ... } block.
 *   3. JSON.parse → Zod validate.
 *
 * Any failure throws LlmJsonParseError with the raw text attached so the
 * caller can decide whether to retry.
 */
export function parseStrictJson<T>(rawText: string, schema: ZodTypeAny): T {
  const stripped = stripCodeFences(rawText);
  const block = extractFirstJsonBlock(stripped);
  if (block === null) {
    throw new LlmJsonParseError("no JSON object found in LLM response", rawText);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(block);
  } catch (err) {
    throw new LlmJsonParseError(
      `JSON.parse failed: ${err instanceof Error ? err.message : String(err)}`,
      rawText,
    );
  }

  const result = (schema as z.ZodType<T>).safeParse(parsed);
  if (!result.success) {
    throw new LlmJsonParseError("response did not match schema", rawText, result.error.issues);
  }
  return result.data;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/u.exec(trimmed);
  return fenced ? (fenced[1] ?? trimmed) : trimmed;
}

function extractFirstJsonBlock(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    // eslint-disable-next-line security/detect-object-injection -- bounded loop over local string
    const ch = text[i];
    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") {
      depth += 1;
      continue;
    }
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }
  return null;
}
