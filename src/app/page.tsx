"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useGameStore } from "@/stores/gameStore";
import { preloadAllSounds } from "@/lib/sounds";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RotateCcw, FlipVertical2, BookOpen, Search, Swords, Crown, MessageSquare, PenTool, GraduationCap } from "lucide-react";

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

  // Preload sound effects on mount
  useEffect(() => {
    preloadAllSounds();
  }, []);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b px-4 py-2">
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Chess Coach
        </h1>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/train/opening">
              <BookOpen className="size-4" />
              Openings
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/train/tactics">
              <Swords className="size-4" />
              Tactics
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/train/endgame">
              <Crown className="size-4" />
              Endgames
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/analyze">
              <Search className="size-4" />
              Analyze
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/coach">
              <MessageSquare className="size-4" />
              Coach
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/train/custom">
              <PenTool className="size-4" />
              Custom
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/plan">
              <GraduationCap className="size-4" />
              Study Plan
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => reset()}>
            <RotateCcw className="size-4" />
            New Game
          </Button>
          <Button variant="outline" size="sm" onClick={flipBoard}>
            <FlipVertical2 className="size-4" />
            Flip
          </Button>
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
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
        <div className="min-h-[200px] flex-1 border-t p-4 lg:border-l lg:border-t-0">
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
