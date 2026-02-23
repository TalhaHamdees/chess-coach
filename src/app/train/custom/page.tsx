"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Play, Undo2, FlipVertical2, Trash2 } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { useCustomTrainerStore } from "@/stores/customTrainerStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { SetupBoard } from "@/components/board/SetupBoard";
import { PiecePalette } from "@/components/board/PiecePalette";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { cn } from "@/lib/utils";

export default function CustomTrainerPage() {
  const [fenInput, setFenInput] = useState("");

  const {
    mode,
    boardMap,
    selectedPiece,
    turn,
    validationError,
    placePiece,
    selectPiece,
    setTurn,
    clearBoard,
    resetToStart,
    loadFromFen,
    startTraining,
    backToSetup,
    cleanup,
  } = useCustomTrainerStore();

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
    flipBoard,
  } = useGameStore();

  const { setMode, clearChat } = useCoachStore();

  useEffect(() => {
    return () => {
      cleanup();
      setMode("free-play");
      clearChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadFen = () => {
    if (fenInput.trim()) {
      loadFromFen(fenInput.trim());
      setFenInput("");
    }
  };

  const handleStartTraining = () => {
    startTraining();
  };

  const isValid = validationError === null;

  // Play mode
  if (mode === "play") {
    return (
      <div className="flex h-screen flex-col bg-background">
        <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={backToSetup}
            aria-label="Back to setup"
          >
            <Undo2 className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            Custom Position
          </h1>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={flipBoard}>
              <FlipVertical2 className="size-4" />
              Flip
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
          {/* Left: Board + status + moves */}
          <div className="flex shrink-0 flex-col items-center gap-3 p-4 lg:w-auto">
            <div className="w-full max-w-[36rem]">
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
            </div>

            <div className="flex w-full max-w-[36rem] gap-3">
              <div className="rounded-lg border bg-card px-3 py-2">
                <div className="text-xs font-medium text-muted-foreground">
                  {status.isCheckmate && "Checkmate!"}
                  {status.isStalemate && "Stalemate!"}
                  {status.isDraw && !status.isStalemate && "Draw!"}
                  {status.isCheck && !status.isCheckmate && "Check!"}
                  {!status.isGameOver &&
                    !status.isCheck &&
                    `${status.turn === "w" ? "White" : "Black"} to move`}
                </div>
              </div>
              <div className="min-w-0 flex-1 rounded-lg border bg-card px-3 py-2">
                <MoveHistory moves={moveHistory} />
              </div>
            </div>
          </div>

          {/* Right: Chat panel */}
          <div className="min-h-[200px] flex-1 border-t p-4 lg:border-l lg:border-t-0">
            <ChatPanel />
          </div>
        </div>
      </div>
    );
  }

  // Setup mode
  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Custom Position
        </h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
        {/* Left: Setup board + controls */}
        <div className="flex shrink-0 flex-col items-center gap-3 p-4 lg:w-auto">
          <div className="w-full max-w-[36rem]">
            <SetupBoard
              boardMap={boardMap}
              onSquareClick={placePiece}
            />
          </div>

          {/* Controls row */}
          <div className="flex w-full max-w-[36rem] flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={clearBoard}>
              <Trash2 className="size-4" />
              Clear
            </Button>
            <Button variant="outline" size="sm" onClick={resetToStart}>
              <RotateCcw className="size-4" />
              Start Position
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTurn(turn === "w" ? "b" : "w")}
            >
              <span
                className={cn(
                  "size-3 rounded-full border",
                  turn === "w" ? "bg-white" : "bg-black"
                )}
              />
              {turn === "w" ? "White" : "Black"} to move
            </Button>
          </div>

          {/* FEN input */}
          <div className="flex w-full max-w-[36rem] gap-2">
            <input
              type="text"
              value={fenInput}
              onChange={(e) => setFenInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLoadFen()}
              placeholder="Paste FEN string..."
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="FEN input"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadFen}
              disabled={!fenInput.trim()}
            >
              Load
            </Button>
          </div>

          {/* Validation status */}
          {validationError && (
            <p className="w-full max-w-[36rem] text-sm text-destructive" role="alert">
              {validationError}
            </p>
          )}

          {/* Start training button */}
          <Button
            className="w-full max-w-[36rem]"
            size="lg"
            onClick={handleStartTraining}
            disabled={!isValid}
          >
            <Play className="size-4" />
            Start Training
          </Button>
        </div>

        {/* Right: Piece palette */}
        <div className="border-t p-4 lg:border-l lg:border-t-0">
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            Select a piece
          </h2>
          <PiecePalette
            selectedPiece={selectedPiece}
            onSelectPiece={selectPiece}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Click a piece, then click the board to place it. Use the eraser to remove pieces.
          </p>
        </div>
      </div>
    </div>
  );
}
