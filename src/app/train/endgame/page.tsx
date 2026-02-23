"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { useEndgameStore } from "@/stores/endgameStore";
import { useProgressStore } from "@/stores/progressStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { EndgameCard } from "@/components/training/EndgameCard";
import { TrainerFeedback } from "@/components/training/TrainerFeedback";
import {
  ENDGAME_POSITIONS,
  getEndgamesByCategory,
  getEndgamesByDifficulty,
} from "@/lib/data/endgames";
import type { EndgameCategory, EndgameDifficulty } from "@/types/endgame";
import { cn } from "@/lib/utils";

type Filter = "all" | EndgameCategory | EndgameDifficulty;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "Beginner", value: "beginner" },
  { label: "Intermediate", value: "intermediate" },
  { label: "Advanced", value: "advanced" },
];

export default function EndgamePage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");
  const [activePosition, setActivePosition] = useState<string | null>(null);

  // Stores
  const hydrate = useProgressStore((s) => s.hydrate);
  const getCompletedEndgameCount = useProgressStore((s) => s.getCompletedEndgameCount);
  const isEndgameCompleted = useProgressStore((s) => s.isEndgameCompleted);
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
    position,
    status,
    currentMoveIndex,
    playerColor,
    wrongAttempts,
    hintText,
    selectedSquare,
    validMoveTargets,
    completedPositions,
    loadPosition,
    handleSquareClick,
    retryPosition,
    showHint,
    cleanup,
  } = useEndgameStore();

  useEffect(() => {
    hydrate();
    setMode("endgame");
    return () => {
      cleanup();
      setMode("free-play");
      clearChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectPosition = (positionId: string) => {
    const found = ENDGAME_POSITIONS.find((p) => p.id === positionId);
    if (!found) return;
    setActivePosition(positionId);
    loadPosition(found);
    clearChat();
  };

  let filteredPositions = ENDGAME_POSITIONS;
  if (selectedFilter === "beginner" || selectedFilter === "intermediate" || selectedFilter === "advanced") {
    filteredPositions = getEndgamesByDifficulty(selectedFilter);
  } else if (selectedFilter !== "all") {
    filteredPositions = getEndgamesByCategory(selectedFilter as EndgameCategory);
  }

  const completedCount = getCompletedEndgameCount();
  const totalMoves = position?.solution.length ?? 0;
  const isInteractive = status === "solving";

  // Trainer view when position is active
  if (activePosition && position) {
    // Map endgame status to TrainerFeedback's TrainerStatus
    const feedbackStatus =
      status === "solving" ? "playing" as const :
      status === "opponent-moving" ? "opponent-moving" as const :
      status === "wrong-move" ? "wrong-move" as const :
      status === "completed" ? "completed" as const :
      "idle" as const;

    return (
      <div className="flex h-screen flex-col bg-background">
        {/* Header */}
        <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              cleanup();
              setActivePosition(null);
            }}
            aria-label="Back to endgames"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-lg font-bold tracking-tight text-foreground">
            {position.name}
          </h1>
          <Badge variant="outline" className="text-xs">
            {position.category}
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
              <TrainerFeedback
                status={feedbackStatus}
                currentMoveIndex={currentMoveIndex}
                totalMoves={totalMoves}
                annotation={hintText}
                wrongAttempts={wrongAttempts}
                playerColor={playerColor}
                onRetry={retryPosition}
                onHint={showHint}
              />
            </div>

            {/* Move history */}
            <div className="w-full max-w-[36rem] rounded-lg border bg-card px-3 py-2">
              <MoveHistory moves={moveHistory} />
            </div>
          </div>

          {/* Right: Key techniques + Chat */}
          <div className="min-h-[400px] flex-1 space-y-4 border-t p-4 lg:border-l lg:border-t-0">
            {/* Key techniques */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Key Techniques
              </h3>
              <ul className="space-y-1">
                {position.keyTechniques.map((technique) => (
                  <li
                    key={technique}
                    className="text-xs text-muted-foreground"
                  >
                    &bull; {technique}
                  </li>
                ))}
              </ul>
            </div>

            {/* Position description */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                About This Endgame
              </h3>
              <p className="text-sm text-muted-foreground">{position.description}</p>
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
          Endgame Trainer
        </h1>
        {completedCount > 0 && (
          <Badge variant="outline" className="text-xs">
            {completedCount}/{ENDGAME_POSITIONS.length} completed
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

      {/* Position grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredPositions.map((p) => (
            <EndgameCard
              key={p.id}
              position={p}
              onSelect={handleSelectPosition}
              completed={!!completedPositions[p.id] || isEndgameCompleted(p.id)}
            />
          ))}
        </div>

        {filteredPositions.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No endgame positions found for this filter.
          </p>
        )}
      </div>
    </div>
  );
}
