import { type Framework, isFramework, listFrameworks } from "./index";

/**
 * Parse a comma-separated `--frameworks` value into validated framework ids.
 *
 * Case-insensitive; whitespace and empty segments are ignored; duplicates are
 * collapsed while preserving first-seen order. Throws with a helpful message
 * listing the valid ids when a segment is unknown, or when nothing parses.
 */
export function parseFrameworksArg(value: string): Framework[] {
  const ids = value
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter((part) => part.length > 0);

  if (ids.length === 0) {
    throw new Error(`no frameworks given. Valid ids: ${listFrameworks().join(", ")}`);
  }

  const selected: Framework[] = [];
  for (const id of ids) {
    if (!isFramework(id)) {
      throw new Error(`unknown framework: "${id}". Valid ids: ${listFrameworks().join(", ")}`);
    }
    if (!selected.includes(id)) selected.push(id);
  }

  return selected;
}

/**
 * Parse framework ids submitted from a multi-select form (`name="frameworks"`).
 * Throws when nothing is selected or any id is unknown.
 */
export function parseFrameworksSelection(values: readonly string[]): Framework[] {
  if (values.length === 0) {
    throw new Error(`no frameworks selected. Valid ids: ${listFrameworks().join(", ")}`);
  }
  return parseFrameworksArg(values.join(","));
}
