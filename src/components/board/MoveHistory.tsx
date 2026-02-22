"use client";

import { cn } from "@/lib/utils";

interface MoveHistoryProps {
  moves: string[];
}

export function MoveHistory({ moves }: MoveHistoryProps) {
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
      {pairs.map((pair) => (
        <div key={pair.number} className="flex gap-1">
          <span className="text-muted-foreground w-6 text-right">
            {pair.number}.
          </span>
          <span className="w-12">{pair.white}</span>
          {pair.black && <span className="w-12">{pair.black}</span>}
        </div>
      ))}
    </div>
  );
}
