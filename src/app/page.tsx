"use client";

import { useGameStore } from "@/stores/gameStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";

export default function Home() {
  const {
    fen,
    selectedSquare,
    validMoveTargets,
    arrows,
    highlights,
    lastMove,
    flipped,
    moveHistory,
    status,
    selectSquare,
    reset,
    flipBoard,
  } = useGameStore();

  return (
    <div className="flex min-h-screen flex-col items-center bg-background px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-foreground">
        Chess Coach
      </h1>

      <div className="flex w-full max-w-4xl flex-col items-center gap-6 lg:flex-row lg:items-start lg:justify-center">
        {/* Board */}
        <ChessBoard
          fen={fen}
          onSquareClick={selectSquare}
          selectedSquare={selectedSquare}
          validMoveTargets={validMoveTargets}
          arrows={arrows}
          highlights={highlights}
          lastMove={lastMove}
          flipped={flipped}
        />

        {/* Side panel */}
        <div className="flex w-full max-w-[36rem] flex-col gap-4 lg:w-64">
          {/* Status */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Status
            </div>
            <div className="text-sm font-medium text-card-foreground">
              {status.isCheckmate && "Checkmate!"}
              {status.isStalemate && "Stalemate!"}
              {status.isDraw && !status.isStalemate && "Draw!"}
              {status.isCheck && !status.isCheckmate && "Check!"}
              {!status.isGameOver &&
                !status.isCheck &&
                `${status.turn === "w" ? "White" : "Black"} to move`}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <button
              onClick={() => reset()}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
            >
              New Game
            </button>
            <button
              onClick={flipBoard}
              className="flex-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-accent"
            >
              Flip Board
            </button>
          </div>

          {/* Move history */}
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Moves
            </div>
            <MoveHistory moves={moveHistory} />
          </div>
        </div>
      </div>
    </div>
  );
}
