import type { Severity } from "@/lib/rules/types";

/**
 * Visual tokens για compliance severity levels.
 *
 * Each token bundles four atomic classes so a badge can render at any
 * density — pill, count-pill, dot-only — without re-deciding colour.
 */
export const SEVERITY_TOKENS: Record<
  Severity,
  {
    /** Human-readable label, sentence case */
    label: string;
    /** bg-* utility for the colored dot */
    dot: string;
    /** text-* utility for the badge label */
    text: string;
    /** border-* utility for badge outline */
    border: string;
    /** bg-* utility for badge fill (very dark, low-saturation) */
    bg: string;
    /** Sort weight — higher is more severe */
    weight: number;
  }
> = {
  CRITICAL: {
    label: "Critical",
    dot: "bg-red-500",
    text: "text-red-300",
    border: "border-red-900",
    bg: "bg-red-950/40",
    weight: 4,
  },
  HIGH: {
    label: "High",
    dot: "bg-orange-500",
    text: "text-orange-300",
    border: "border-orange-900",
    bg: "bg-orange-950/40",
    weight: 3,
  },
  MEDIUM: {
    label: "Medium",
    dot: "bg-amber-500",
    text: "text-amber-300",
    border: "border-amber-900",
    bg: "bg-amber-950/40",
    weight: 2,
  },
  LOW: {
    label: "Low",
    dot: "bg-sky-500",
    text: "text-sky-300",
    border: "border-sky-900",
    bg: "bg-sky-950/40",
    weight: 1,
  },
};

/**
 * Compliance score → colour band.
 *
 * Bands:
 *   - 90–100 → Excellent (emerald)
 *   -  70–89 → Good (lime)
 *   -  40–69 → Needs work (amber)
 *   -   0–39 → Critical (red)
 *
 * Returns Tailwind utility classes pre-prefixed for direct use.
 */
export function scoreBand(score: number): {
  label: string;
  ring: string;
  text: string;
} {
  if (score >= 90) {
    return { label: "Excellent", ring: "stroke-emerald-500", text: "text-emerald-400" };
  }
  if (score >= 70) {
    return { label: "Good", ring: "stroke-lime-500", text: "text-lime-400" };
  }
  if (score >= 40) {
    return { label: "Needs work", ring: "stroke-amber-500", text: "text-amber-400" };
  }
  return { label: "Critical", ring: "stroke-red-500", text: "text-red-400" };
}
