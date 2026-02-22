"use client";

import type { ArrowColor } from "@/types/chess";

interface SquareHighlightProps {
  color: ArrowColor;
  /** Whether this is a valid-move dot (small circle) vs a full square highlight */
  type: "dot" | "square";
}

const HIGHLIGHT_COLORS: Record<ArrowColor, string> = {
  green: "rgba(0, 180, 0, 0.4)",
  red: "rgba(220, 40, 40, 0.4)",
  blue: "rgba(0, 100, 220, 0.4)",
  yellow: "rgba(220, 200, 0, 0.4)",
  orange: "rgba(235, 140, 0, 0.4)",
};

export function SquareHighlight({ color, type }: SquareHighlightProps) {
  if (type === "dot") {
    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[30%] w-[30%] rounded-full"
          style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
        />
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{ backgroundColor: HIGHLIGHT_COLORS[color] }}
    />
  );
}
