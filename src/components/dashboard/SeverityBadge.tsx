import { SEVERITY_TOKENS } from "@/lib/design/tokens";
import type { Severity } from "@/lib/rules/types";

type Variant = "default" | "count" | "dot";

interface Props {
  severity: Severity;
  count?: number;
  variant?: Variant;
  className?: string;
}

export function SeverityBadge({ severity, count, variant = "default", className = "" }: Props) {
  const t = SEVERITY_TOKENS[severity];

  if (variant === "dot") {
    return (
      <span
        aria-label={t.label}
        className={`inline-block size-2 rounded-full ${t.dot} ${className}`}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${t.border} ${t.bg} ${t.text} ${className}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${t.dot}`} />
      <span>{t.label}</span>
      {variant === "count" && count !== undefined && (
        <>
          <span aria-hidden className="text-neutral-500">
            ·
          </span>
          <span className="tabular-nums">{count}</span>
        </>
      )}
    </span>
  );
}
