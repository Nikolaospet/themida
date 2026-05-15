import { scoreBand } from "@/lib/design/tokens";

type Size = "sm" | "md" | "lg";

interface Props {
  score: number;
  size?: Size;
}

const SIZES: Record<
  Size,
  { box: number; stroke: number; numberClass: string; labelClass: string }
> = {
  sm: { box: 80, stroke: 6, numberClass: "text-2xl", labelClass: "text-[10px]" },
  md: { box: 160, stroke: 10, numberClass: "text-5xl", labelClass: "text-xs" },
  lg: { box: 240, stroke: 14, numberClass: "text-7xl", labelClass: "text-sm" },
};

export function ComplianceScore({ score, size = "md" }: Props) {
  const safe = Number.isFinite(score) ? score : 0;
  const clamped = Math.max(0, Math.min(100, Math.round(safe)));
  const { box, stroke, numberClass, labelClass } = SIZES[size];
  const band = scoreBand(clamped);

  const radius = (box - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      role="img"
      aria-label={`Compliance score ${clamped} out of 100, ${band.label.toLowerCase()}`}
      className="inline-flex flex-col items-center"
      style={{ width: box }}
    >
      <div className="relative" style={{ width: box, height: box }}>
        <svg width={box} height={box} viewBox={`0 0 ${box} ${box}`} className="-rotate-90">
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-neutral-800"
          />
          <circle
            cx={box / 2}
            cy={box / 2}
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={`${band.ring} transition-[stroke-dashoffset] duration-500`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`${numberClass} ${band.text} font-semibold tabular-nums`}>
            {clamped}
          </span>
        </div>
      </div>
      <span className={`${labelClass} ${band.text} mt-2 tracking-wider uppercase`}>
        {band.label}
      </span>
    </div>
  );
}
