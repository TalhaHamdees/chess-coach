"use client";

import { cn } from "@/lib/utils";

interface MoveHistoryProps {
  moves: string[];
  /** Optional: highlight a specific move index (0-based) */
  currentMoveIndex?: number;
}

export function MoveHistory({ moves, currentMoveIndex }: MoveHistoryProps) {
  if (moves.length === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">No moves yet</div>
    );
  }

  // Group moves into pairs (white, black)
  const pairs: { number: number; white: string; black?: string }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-mono">
      {pairs.map((pair) => {
        const whiteIndex = (pair.number - 1) * 2;
        const blackIndex = whiteIndex + 1;

        return (
          <div key={pair.number} className="flex gap-1">
            <span className="text-muted-foreground w-6 text-right">
              {pair.number}.
            </span>
            <span
              className={cn(
                "w-12",
                currentMoveIndex !== undefined &&
                  whiteIndex === currentMoveIndex &&
                  "rounded bg-primary/20 px-0.5 font-bold"
              )}
            >
              {pair.white}
            </span>
            {pair.black && (
              <span
                className={cn(
                  "w-12",
                  currentMoveIndex !== undefined &&
                    blackIndex === currentMoveIndex &&
                    "rounded bg-primary/20 px-0.5 font-bold"
                )}
              >
                {pair.black}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
