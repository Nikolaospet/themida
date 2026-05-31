import { type Framework, FRAMEWORK_REGISTRY, isFramework } from "./index";

/** Human-readable labels for framework ids (e.g. `eu-ai-act` → `EU AI Act`). */
export function formatFrameworkLabels(ids: readonly string[]): string {
  return ids
    .map((id) => {
      const key = id.trim().toLowerCase();
      if (isFramework(key)) return FRAMEWORK_REGISTRY[key as Framework].meta.displayName;
      return id;
    })
    .join(", ");
}
