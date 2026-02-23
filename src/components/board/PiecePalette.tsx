"use client";

import type { Piece, PieceColor, PieceType } from "@/types/chess";
import { cn } from "@/lib/utils";
import { Eraser } from "lucide-react";

interface PiecePaletteProps {
  selectedPiece: Piece | null;
  onSelectPiece: (piece: Piece | null) => void;
}

const PIECE_TYPES: PieceType[] = ["k", "q", "r", "b", "n", "p"];
const COLORS: PieceColor[] = ["w", "b"];

function getPieceImageSrc(color: PieceColor, type: PieceType): string {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

function piecesMatch(a: Piece | null, b: Piece): boolean {
  return a !== null && a.type === b.type && a.color === b.color;
}

export function PiecePalette({ selectedPiece, onSelectPiece }: PiecePaletteProps) {
  return (
    <div className="flex flex-col gap-2" role="toolbar" aria-label="Piece palette">
      {COLORS.map((color) => (
        <div key={color} className="flex gap-1">
          {PIECE_TYPES.map((type) => {
            const piece: Piece = { type, color };
            const isSelected = piecesMatch(selectedPiece, piece);
            return (
              <button
                key={`${color}${type}`}
                type="button"
                className={cn(
                  "flex size-10 items-center justify-center rounded-md border-2 transition-colors sm:size-12",
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-transparent bg-muted hover:border-muted-foreground/30"
                )}
                onClick={() => onSelectPiece(piece)}
                aria-label={`${color === "w" ? "white" : "black"} ${type}`}
                aria-pressed={isSelected}
              >
                <img
                  src={getPieceImageSrc(color, type)}
                  alt={`${color === "w" ? "white" : "black"} ${type}`}
                  className="size-7 select-none sm:size-9"
                  draggable={false}
                />
              </button>
            );
          })}
        </div>
      ))}

      {/* Eraser button */}
      <button
        type="button"
        className={cn(
          "flex h-10 w-full items-center justify-center gap-2 rounded-md border-2 text-sm transition-colors sm:h-12",
          selectedPiece === null
            ? "border-primary bg-primary/10 text-primary"
            : "border-transparent bg-muted text-muted-foreground hover:border-muted-foreground/30"
        )}
        onClick={() => onSelectPiece(null)}
        aria-label="Eraser (remove pieces)"
        aria-pressed={selectedPiece === null}
      >
        <Eraser className="size-4" />
        Remove
      </button>
    </div>
  );
}
