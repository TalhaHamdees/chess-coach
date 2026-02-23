"use client";

import { useMemo } from "react";
import type { Square, PieceColor, PieceType } from "@/types/chess";
import type { BoardMap } from "@/lib/chess/fen";
import { cn } from "@/lib/utils";

interface SetupBoardProps {
  boardMap: BoardMap;
  onSquareClick: (square: Square) => void;
  flipped?: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function getPieceImageSrc(color: PieceColor, type: PieceType): string {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

function isLightSquare(file: string, rank: string): boolean {
  const fileIdx = file.charCodeAt(0) - 97;
  const rankIdx = parseInt(rank, 10) - 1;
  return (fileIdx + rankIdx) % 2 === 1;
}

export function SetupBoard({ boardMap, onSquareClick, flipped = false }: SetupBoardProps) {
  const displayFiles = useMemo(
    () => (flipped ? [...FILES].reverse() : FILES),
    [flipped]
  );
  const displayRanks = useMemo(
    () => (flipped ? [...RANKS].reverse() : RANKS),
    [flipped]
  );

  return (
    <div className="relative inline-block w-full max-w-[36rem] select-none">
      <div
        className="grid w-full grid-cols-8 rounded-sm border-2 border-neutral-700"
        role="grid"
        aria-label="Setup board"
      >
        {displayRanks.map((rank) =>
          displayFiles.map((file) => {
            const square = `${file}${rank}`;
            const piece = boardMap.get(square);
            const isLight = isLightSquare(file, rank);

            return (
              <div
                key={square}
                role="gridcell"
                aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
                data-square={square}
                className={cn(
                  "relative flex aspect-square cursor-pointer items-center justify-center transition-colors hover:brightness-110",
                  isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]"
                )}
                onClick={() => onSquareClick(square)}
              >
                {piece && (
                  <img
                    src={getPieceImageSrc(piece.color, piece.type)}
                    alt={`${piece.color === "w" ? "white" : "black"} ${piece.type}`}
                    className="pointer-events-none relative z-10 h-[85%] w-[85%] select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]"
                    draggable={false}
                  />
                )}

                {/* Coordinate labels */}
                {rank === (flipped ? "8" : "1") && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 right-1 text-[0.55rem] font-semibold leading-none",
                      isLight ? "text-[#b58863]" : "text-[#f0d9b5]"
                    )}
                  >
                    {file}
                  </span>
                )}
                {file === (flipped ? "h" : "a") && (
                  <span
                    className={cn(
                      "absolute left-1 top-0.5 text-[0.55rem] font-semibold leading-none",
                      isLight ? "text-[#b58863]" : "text-[#f0d9b5]"
                    )}
                  >
                    {rank}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
