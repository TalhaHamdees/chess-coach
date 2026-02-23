"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, FlipVertical2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { preloadAllSounds } from "@/lib/sounds";

export default function CoachPage() {
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

  const { setMode, clearChat } = useCoachStore();

  useEffect(() => {
    preloadAllSounds();
    setMode("free-play");
    clearChat();
    return () => {
      setMode("free-play");
      clearChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          asChild
        >
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Coach Chat
        </h1>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={() => reset()}>
            <RotateCcw className="size-4" />
            New Game
          </Button>
          <Button variant="outline" size="sm" onClick={flipBoard}>
            <FlipVertical2 className="size-4" />
            Flip
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
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

          {/* Status + Move history */}
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
        <div className="min-h-[400px] flex-1 border-t p-4 lg:border-l lg:border-t-0">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
