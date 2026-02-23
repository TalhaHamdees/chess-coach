"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { useTacticsStore } from "@/stores/tacticsStore";
import { useProgressStore } from "@/stores/progressStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { PuzzleCard } from "@/components/training/PuzzleCard";
import { TacticsFeedback } from "@/components/training/TacticsFeedback";
import {
  TACTICS_PUZZLES,
  getPuzzlesByTheme,
  getPuzzlesByDifficulty,
} from "@/lib/data/tactics";
import type { TacticsTheme, PuzzleDifficulty } from "@/types/tactics";
import { cn } from "@/lib/utils";

type Filter = "all" | TacticsTheme | PuzzleDifficulty;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

export default function TacticsPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
  const [activePuzzle, setActivePuzzle] = useState<string | null>(null);

  // Stores
  const hydrate = useProgressStore((s) => s.hydrate);
  const getSolvedTacticsCount = useProgressStore((s) => s.getSolvedTacticsCount);
  const getTacticsProgress = useProgressStore((s) => s.getTacticsProgress);
  const { setMode, clearChat } = useCoachStore();

  const {
    fen,
    arrows,
    highlights,
    lastMove,
    flipped,
    moveHistory,
  } = useGameStore();

  const {
    puzzle,
    status,
    currentMoveIndex,
    playerColor,
    wrongAttempts,
    hintText,
    selectedSquare,
    validMoveTargets,
    solvedPuzzles,
    loadPuzzle,
    handleSquareClick,
    retryPuzzle,
    showHint,
    cleanup,
  } = useTacticsStore();

  useEffect(() => {
    hydrate();
    setMode("tactics");
    return () => {
      cleanup();
      setMode("free-play");
      clearChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPuzzle = (puzzleId: string) => {
    const found = TACTICS_PUZZLES.find((p) => p.id === puzzleId);
    if (!found) return;
    setActivePuzzle(puzzleId);
    loadPuzzle(found);
    clearChat();
  };

  let filteredPuzzles = TACTICS_PUZZLES;
  if (selectedFilter === "beginner" || selectedFilter === "intermediate" || selectedFilter === "advanced") {
    filteredPuzzles = getPuzzlesByDifficulty(selectedFilter);
  } else if (selectedFilter !== "all") {
    filteredPuzzles = getPuzzlesByTheme(selectedFilter as TacticsTheme);
  }

  const solvedCount = getSolvedTacticsCount();
  const totalMoves = puzzle?.solution.length ?? 0;
  const isInteractive = status === "solving";

  // Show trainer view when a puzzle is active
  if (activePuzzle && puzzle) {
    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              cleanup();
              setActivePuzzle(null);
            }}
            aria-label="Back to puzzles"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {puzzle.name}
          </h1>
          <Badge variant="outline" className="text-xs">
            {puzzle.theme}
          </Badge>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>

        {/* Main content */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row">
          {/* Left: Board + feedback + move history */}
          <div className="flex shrink-0 flex-col items-center gap-3 p-4 lg:w-auto">
            <div className="w-full max-w-[36rem]">
              <ChessBoard
                fen={fen}
                onSquareClick={handleSquareClick}
                selectedSquare={selectedSquare}
                validMoveTargets={validMoveTargets}
                arrows={arrows}
                highlights={highlights}
                lastMove={lastMove}
                flipped={flipped}
                interactive={isInteractive}
              />
            </div>

            {/* Feedback */}
            <div className="w-full max-w-[36rem]">
              <TacticsFeedback
                status={status}
                currentMoveIndex={currentMoveIndex}
                totalMoves={totalMoves}
                hintText={hintText}
                wrongAttempts={wrongAttempts}
                playerColor={playerColor}
                onRetry={retryPuzzle}
                onHint={showHint}
              />
            </div>

            {/* Move history */}
            <div className="w-full max-w-[36rem] rounded-lg border bg-card px-3 py-2">
              <MoveHistory moves={moveHistory} />
            </div>
          </div>

          {/* Right: Description + Chat (desktop) */}
          <div className="flex-1 space-y-4 border-t p-4 lg:border-l lg:border-t-0">
            {/* Puzzle description */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Puzzle Info
              </h3>
              <p className="text-sm text-muted-foreground">{puzzle.description}</p>
              <div className="mt-3 flex gap-2">
                <Badge className={cn("border-0", {
                  "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200": puzzle.difficulty === "beginner",
                  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200": puzzle.difficulty === "intermediate",
                  "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200": puzzle.difficulty === "advanced",
                })}>
                  {puzzle.difficulty}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Play as {puzzle.playerColor === "w" ? "White" : "Black"}
                </span>
              </div>
            </div>

            {/* Chat panel */}
            <ChatPanel />
          </div>
        </div>
      </div>
    );
  }

  // Selector view
  return (
    <div className="flex min-h-screen flex-col bg-background">
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
          Tactics Trainer
        </h1>
        {solvedCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {solvedCount}/{TACTICS_PUZZLES.length} solved
          </Badge>
        )}
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex gap-2 border-b px-4 py-3">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(filter.value)}
            className={cn(
              selectedFilter === filter.value && "pointer-events-none"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Puzzle grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPuzzles.map((p) => (
            <PuzzleCard
              key={p.id}
              puzzle={p}
              onSelect={handleSelectPuzzle}
              solved={!!solvedPuzzles[p.id] || !!getTacticsProgress(p.id)?.solved}
            />
          ))}
        </div>

        {filteredPuzzles.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No puzzles found for this filter.
          </p>
        )}
      </div>
    </div>
  );
}
