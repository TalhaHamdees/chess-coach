"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { useAnalysisStore } from "@/stores/analysisStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { MoveNavigator } from "@/components/analysis/MoveNavigator";
import { PGNImport } from "@/components/analysis/PGNImport";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { LichessExplorer } from "@/components/training/LichessExplorer";
import { Button } from "@/components/ui/button";
import { buildAnalysisContext } from "@/lib/ai/prompts";

export default function AnalyzePage() {
  const router = useRouter();

  // Game store
  const {
    fen,
    arrows,
    highlights,
    lastMove,
    flipped,
    moveHistory,
    isNavigating,
    currentPositionIndex,
    positionHistory,
    selectSquare,
    goToPosition,
    goForward,
    goBack,
    goToStart,
    goToEnd,
  } = useGameStore();

  // Analysis store
  const { parsedGame, reset: resetAnalysis } = useAnalysisStore();

  // Coach store
  const { sendMessage, messages } = useCoachStore();

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!isNavigating) return;

      // Don't capture if user is typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goBack();
          break;
        case "ArrowRight":
          e.preventDefault();
          goForward();
          break;
        case "Home":
          e.preventDefault();
          goToStart();
          break;
        case "End":
          e.preventDefault();
          goToEnd();
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isNavigating, goBack, goForward, goToStart, goToEnd]);

  // Send initial analysis context when game is loaded
  useEffect(() => {
    if (parsedGame && messages.length === 0) {
      const context = buildAnalysisContext({
        headers: parsedGame.headers,
        currentMoveIndex: -1,
        totalMoves: parsedGame.moves.length,
      });
      sendMessage(context);
    }
    // Only run when parsedGame changes, not on every message
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedGame]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAnalysis();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMoveClick = (moveIndex: number) => {
    goToPosition(moveIndex);
  };

  const gameLoaded = parsedGame !== null;

  // Build game info string
  const gameInfo = parsedGame
    ? [
        parsedGame.headers.white && parsedGame.headers.black
          ? `${parsedGame.headers.white}${parsedGame.headers.whiteElo ? ` (${parsedGame.headers.whiteElo})` : ""} vs ${parsedGame.headers.black}${parsedGame.headers.blackElo ? ` (${parsedGame.headers.blackElo})` : ""}`
          : null,
        parsedGame.result,
      ]
        .filter(Boolean)
        .join(" \u2022 ")
    : "";

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/")}
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Game Analysis
        </h1>
        {gameInfo && (
          <span className="truncate text-sm text-muted-foreground">
            {gameInfo}
          </span>
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
        {/* Left: Board + navigator + move history */}
        <div className="flex shrink-0 flex-col items-center gap-3 p-4 lg:w-auto">
          <div className="w-full max-w-[36rem]">
            <ChessBoard
              fen={fen}
              onSquareClick={selectSquare}
              selectedSquare={null}
              validMoveTargets={[]}
              arrows={arrows}
              highlights={highlights}
              lastMove={lastMove}
              flipped={flipped}
              interactive={!isNavigating}
            />
          </div>

          {/* Move navigator */}
          {isNavigating && (
            <div className="w-full max-w-[36rem]">
              <MoveNavigator />
            </div>
          )}

          {/* Position info */}
          {isNavigating && (
            <div className="w-full max-w-[36rem] rounded-lg border bg-card px-3 py-2">
              <div className="text-xs text-muted-foreground">
                {currentPositionIndex === -1
                  ? "Starting position"
                  : `Move ${Math.floor(currentPositionIndex / 2) + 1}${currentPositionIndex % 2 === 0 ? "." : "..."} ${positionHistory[currentPositionIndex]?.san ?? ""} (${currentPositionIndex + 1}/${positionHistory.length})`}
              </div>
            </div>
          )}

          {/* Move history */}
          <div className="w-full max-w-[36rem] rounded-lg border bg-card px-3 py-2">
            <MoveHistory
              moves={moveHistory}
              currentMoveIndex={isNavigating ? currentPositionIndex : undefined}
              onMoveClick={isNavigating ? handleMoveClick : undefined}
            />
          </div>
        </div>

        {/* Right panel */}
        <div className="min-h-[400px] flex-1 space-y-4 border-t p-4 lg:border-l lg:border-t-0">
          {!gameLoaded ? (
            <PGNImport />
          ) : (
            <>
              {/* Game headers info card */}
              {parsedGame.headers.event && (
                <div className="rounded-lg border bg-card p-4">
                  <h3 className="mb-1 text-sm font-semibold text-foreground">
                    {parsedGame.headers.event}
                  </h3>
                  {parsedGame.headers.date && (
                    <p className="text-xs text-muted-foreground">
                      {parsedGame.headers.date}
                    </p>
                  )}
                </div>
              )}

              {/* Lichess Explorer for current position */}
              <LichessExplorer fen={fen} playerColor="w" />

              {/* Chat panel */}
              <ChatPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
