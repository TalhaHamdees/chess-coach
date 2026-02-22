"use client";

import type { Arrow, ArrowColor } from "@/types/chess";

interface ArrowOverlayProps {
  arrows: Arrow[];
  squareSize: number;
  flipped: boolean;
}

const ARROW_COLORS: Record<ArrowColor, string> = {
  green: "rgba(0, 180, 0, 0.8)",
  red: "rgba(220, 40, 40, 0.8)",
  blue: "rgba(0, 100, 220, 0.8)",
  yellow: "rgba(220, 200, 0, 0.8)",
  orange: "rgba(235, 140, 0, 0.8)",
};

function squareToCoords(
  square: string,
  squareSize: number,
  flipped: boolean
): { x: number; y: number } {
  const file = square.charCodeAt(0) - 97; // a=0, b=1, ..., h=7
  const rank = parseInt(square[1], 10) - 1; // 1=0, 2=1, ..., 8=7

  const col = flipped ? 7 - file : file;
  const row = flipped ? rank : 7 - rank;

  return {
    x: col * squareSize + squareSize / 2,
    y: row * squareSize + squareSize / 2,
  };
}

export function ArrowOverlay({ arrows, squareSize, flipped }: ArrowOverlayProps) {
  if (arrows.length === 0) return null;

  const boardSize = squareSize * 8;
  const headSize = squareSize * 0.3;
  const strokeWidth = squareSize * 0.15;

  return (
    <svg
      className="pointer-events-none absolute inset-0"
      width={boardSize}
      height={boardSize}
      viewBox={`0 0 ${boardSize} ${boardSize}`}
    >
      <defs>
        {arrows.map((arrow, i) => (
          <marker
            key={`head-${i}`}
            id={`arrowhead-${i}`}
            markerWidth={headSize}
            markerHeight={headSize}
            refX={headSize * 0.7}
            refY={headSize / 2}
            orient="auto"
          >
            <polygon
              points={`0 0, ${headSize} ${headSize / 2}, 0 ${headSize}`}
              fill={ARROW_COLORS[arrow.color]}
            />
          </marker>
        ))}
      </defs>
      {arrows.map((arrow, i) => {
        const from = squareToCoords(arrow.from, squareSize, flipped);
        const to = squareToCoords(arrow.to, squareSize, flipped);

        // Shorten the line so the arrowhead doesn't overshoot
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const shortenBy = headSize * 0.6;
        const ratio = (length - shortenBy) / length;

        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={from.x + dx * ratio}
            y2={from.y + dy * ratio}
            stroke={ARROW_COLORS[arrow.color]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            markerEnd={`url(#arrowhead-${i})`}
            opacity={0.85}
          />
        );
      })}
    </svg>
  );
}
