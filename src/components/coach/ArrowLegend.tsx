import { cn } from "@/lib/utils";
import type { Arrow, ArrowColor } from "@/types/chess";

interface ArrowLegendProps {
  arrows: Arrow[];
}

const COLOR_DOTS: Record<ArrowColor, string> = {
  green: "bg-green-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
};

const COLOR_LABELS: Record<ArrowColor, string> = {
  green: "recommended",
  red: "danger",
  blue: "alternative",
  yellow: "key square",
  orange: "threat",
};

export function ArrowLegend({ arrows }: ArrowLegendProps) {
  if (arrows.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1" data-testid="arrow-legend">
      {arrows.map((arrow, i) => (
        <span
          key={`${arrow.from}-${arrow.to}-${i}`}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span
            className={cn(
              "inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold text-white",
              COLOR_DOTS[arrow.color]
            )}
          >
            {i + 1}
          </span>
          <span>
            {arrow.from}&rarr;{arrow.to}
          </span>
          <span className="text-muted-foreground/70">
            {COLOR_LABELS[arrow.color]}
          </span>
        </span>
      ))}
    </div>
  );
}
