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

const LABEL_BG_COLORS: Record<ArrowColor, string> = {
  green: "rgba(0, 140, 0, 0.95)",
  red: "rgba(180, 30, 30, 0.95)",
  blue: "rgba(0, 75, 180, 0.95)",
  yellow: "rgba(180, 160, 0, 0.95)",
  orange: "rgba(200, 115, 0, 0.95)",
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
  const headWidth = squareSize * 0.22;
  const headLength = squareSize * 0.28;
  const strokeWidth = squareSize * 0.11;
  const showLabels = arrows.length >= 2;

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
            markerUnits="userSpaceOnUse"
            markerWidth={headLength}
            markerHeight={headWidth}
            refX={headLength}
            refY={headWidth / 2}
            orient="auto"
          >
            <polygon
              points={`0 0, ${headLength} ${headWidth / 2}, 0 ${headWidth}`}
              fill={ARROW_COLORS[arrow.color]}
            />
          </marker>
        ))}
      </defs>
      {arrows.map((arrow, i) => {
        const from = squareToCoords(arrow.from, squareSize, flipped);
        const to = squareToCoords(arrow.to, squareSize, flipped);

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const shortenBy = headLength * 0.5;
        const ratio = (length - shortenBy) / length;

        return (
          <line
            key={`arrow-${i}`}
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
      {showLabels &&
        arrows.map((arrow, i) => {
          const from = squareToCoords(arrow.from, squareSize, flipped);
          const to = squareToCoords(arrow.to, squareSize, flipped);

          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const length = Math.sqrt(dx * dx + dy * dy);

          // Position at 75% along the arrow
          const cx = from.x + dx * 0.75;
          const cy = from.y + dy * 0.75;

          // Offset perpendicular to the arrow direction
          const perpX = -dy / length;
          const perpY = dx / length;
          const offset = squareSize * 0.18;

          const labelX = cx + perpX * offset;
          const labelY = cy + perpY * offset;
          const labelR = squareSize * 0.13;

          return (
            <g key={`label-${i}`}>
              <circle
                cx={labelX}
                cy={labelY}
                r={labelR}
                fill={LABEL_BG_COLORS[arrow.color]}
                stroke="white"
                strokeWidth={1.5}
              />
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontWeight="bold"
                fontSize={labelR * 1.3}
                style={{ userSelect: "none" }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}
    </svg>
  );
}
