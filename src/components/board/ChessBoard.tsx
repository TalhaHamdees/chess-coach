"use client";

import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { createGame, getPiece } from "@/lib/chess/engine";
import type {
  FEN,
  Square,
  Arrow,
  SquareHighlight as SquareHighlightType,
  ChessMove,
  PieceColor,
  PieceType,
} from "@/types/chess";
import { cn } from "@/lib/utils";
import { SquareHighlight } from "./SquareHighlight";
import { ArrowOverlay } from "./ArrowOverlay";

/** Unicode chess piece characters */
const PIECE_UNICODE: Record<PieceColor, Record<PieceType, string>> = {
  w: { k: "\u2654", q: "\u2655", r: "\u2656", b: "\u2657", n: "\u2658", p: "\u2659" },
  b: { k: "\u265A", q: "\u265B", r: "\u265C", b: "\u265D", n: "\u265E", p: "\u265F" },
};

interface ChessBoardProps {
  /** Current board position as FEN */
  fen: FEN;
  /** Called when a move is made (from click-to-move) */
  onMove?: (move: ChessMove) => void;
  /** Called when a square is clicked */
  onSquareClick?: (square: Square) => void;
  /** Currently selected square */
  selectedSquare?: Square | null;
  /** Squares where the selected piece can move */
  validMoveTargets?: Square[];
  /** Arrows to draw on the board */
  arrows?: Arrow[];
  /** Squares to highlight */
  highlights?: SquareHighlightType[];
  /** Last move to highlight */
  lastMove?: { from: Square; to: Square } | null;
  /** Whether the board is flipped (black at bottom) */
  flipped?: boolean;
  /** Whether the board is interactive */
  interactive?: boolean;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

function getSquareId(file: string, rank: string): Square {
  return `${file}${rank}`;
}

function isLightSquare(file: string, rank: string): boolean {
  const fileIdx = file.charCodeAt(0) - 97;
  const rankIdx = parseInt(rank, 10) - 1;
  return (fileIdx + rankIdx) % 2 === 1;
}

export function ChessBoard({
  fen,
  onMove,
  onSquareClick,
  selectedSquare = null,
  validMoveTargets = [],
  arrows = [],
  highlights = [],
  lastMove = null,
  flipped = false,
  interactive = true,
}: ChessBoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const [squareSize, setSquareSize] = useState(0);

  // Measure square size for arrow overlay
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const measure = () => {
      const width = board.clientWidth;
      setSquareSize(width / 8);
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(board);
    return () => observer.disconnect();
  }, []);

  const game = useMemo(() => {
    try {
      return createGame(fen);
    } catch {
      return createGame();
    }
  }, [fen]);

  const displayFiles = useMemo(
    () => (flipped ? [...FILES].reverse() : FILES),
    [flipped]
  );
  const displayRanks = useMemo(
    () => (flipped ? [...RANKS].reverse() : RANKS),
    [flipped]
  );

  const highlightMap = useMemo(() => {
    const map = new Map<string, SquareHighlightType>();
    for (const h of highlights) {
      map.set(h.square, h);
    }
    return map;
  }, [highlights]);

  const handleSquareClick = useCallback(
    (square: Square) => {
      if (!interactive) return;
      onSquareClick?.(square);
    },
    [interactive, onSquareClick]
  );

  return (
    <div className="relative inline-block w-full max-w-[36rem] select-none">
      {/* Board grid */}
      <div
        ref={boardRef}
        className="grid w-full grid-cols-8 rounded-sm border-2 border-neutral-700"
        role="grid"
        aria-label="Chess board"
      >
        {displayRanks.map((rank) =>
          displayFiles.map((file) => {
            const square = getSquareId(file, rank);
            const piece = getPiece(game, square);
            const isLight = isLightSquare(file, rank);
            const isSelected = selectedSquare === square;
            const isValidTarget = validMoveTargets.includes(square);
            const isLastMoveSquare =
              lastMove !== null &&
              (lastMove.from === square || lastMove.to === square);
            const highlight = highlightMap.get(square);
            const hasPiece = piece !== null;

            return (
              <div
                key={square}
                role="gridcell"
                aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
                data-square={square}
                className={cn(
                  "relative flex aspect-square items-center justify-center",
                  "cursor-pointer",
                  // Board colors
                  isLight ? "bg-amber-100" : "bg-amber-800",
                  // Selected square
                  isSelected && "!bg-yellow-400/70",
                  // Last move highlight
                  isLastMoveSquare &&
                    !isSelected &&
                    (isLight ? "bg-yellow-200" : "bg-yellow-600/60")
                )}
                onClick={() => handleSquareClick(square)}
              >
                {/* Coach highlight */}
                {highlight && (
                  <SquareHighlight color={highlight.color} type="square" />
                )}

                {/* Valid move indicator */}
                {isValidTarget && !hasPiece && (
                  <SquareHighlight color="green" type="dot" />
                )}

                {/* Valid capture indicator */}
                {isValidTarget && hasPiece && (
                  <div className="pointer-events-none absolute inset-0 rounded-full border-[3px] border-green-600/60" />
                )}

                {/* Piece */}
                {piece && (
                  <span className="pointer-events-none relative z-10 select-none text-[clamp(1.5rem,10cqw,4rem)] leading-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">
                    {PIECE_UNICODE[piece.color][piece.type]}
                  </span>
                )}

                {/* Coordinate labels */}
                {rank === (flipped ? "8" : "1") && (
                  <span
                    className={cn(
                      "absolute bottom-0.5 right-1 text-[0.55rem] font-semibold leading-none",
                      isLight ? "text-amber-800/60" : "text-amber-100/60"
                    )}
                  >
                    {file}
                  </span>
                )}
                {file === (flipped ? "h" : "a") && (
                  <span
                    className={cn(
                      "absolute left-1 top-0.5 text-[0.55rem] font-semibold leading-none",
                      isLight ? "text-amber-800/60" : "text-amber-100/60"
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

      {/* Arrow overlay */}
      {arrows.length > 0 && squareSize > 0 && (
        <ArrowOverlay
          arrows={arrows}
          squareSize={squareSize}
          flipped={flipped}
        />
      )}
    </div>
  );
}
