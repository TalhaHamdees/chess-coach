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

/** SVG piece image paths */
function getPieceImageSrc(color: PieceColor, type: PieceType): string {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

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
                  // Board colors (Lichess-style)
                  isLight ? "bg-[#f0d9b5]" : "bg-[#b58863]",
                  // Selected square
                  isSelected && (isLight ? "!bg-[#f6f669]" : "!bg-[#baca2b]"),
                  // Last move highlight
                  isLastMoveSquare &&
                    !isSelected &&
                    (isLight ? "bg-[#cdd16a]" : "bg-[#aaa23a]")
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
