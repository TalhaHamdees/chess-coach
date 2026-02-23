"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { useOpeningTrainerStore } from "@/stores/openingTrainerStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { VariationTree } from "@/components/training/VariationTree";
import { TrainerFeedback } from "@/components/training/TrainerFeedback";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOpeningById } from "@/lib/data/openings";

export default function OpeningTrainerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const opening = getOpeningById(params.id);

  // Game store — board state (FEN, arrows, highlights, etc.)
  const {
    fen,
    arrows,
    highlights,
    lastMove,
    flipped,
    moveHistory,
    flipBoard,
  } = useGameStore();

  // Coach store — chat
  const { setMode, clearChat } = useCoachStore();

  // Trainer store — interactive trainer logic
  const {
    status,
    activeVariation,
    currentMoveIndex,
    playerColor,
    wrongAttempts,
    currentAnnotation,
    completedVariations,
    selectedSquare,
    validMoveTargets,
    initOpening,
    startVariation,
    handleSquareClick,
    retryVariation,
    showHint,
    cleanup,
  } = useOpeningTrainerStore();

  useEffect(() => {
    if (!opening) return;

    // Initialize the trainer with this opening
    initOpening(opening);

    // Reset board to opening starting position
    useGameStore.getState().reset(opening.startingFen);

    // Flip board if student plays Black
    const currentFlipped = useGameStore.getState().flipped;
    if (opening.playerColor === "b" && !currentFlipped) {
      flipBoard();
    } else if (opening.playerColor === "w" && currentFlipped) {
      flipBoard();
    }

    // Configure coach mode
    setMode("opening-trainer");
    clearChat();

    return () => {
      cleanup();
      setMode("free-play");
      clearChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opening?.id]);

  if (!opening) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-lg text-muted-foreground">Opening not found.</p>
        <Button variant="outline" onClick={() => router.push("/train/opening")}>
          <ArrowLeft className="size-4" />
          Back to Openings
        </Button>
      </div>
    );
  }

  const totalMoves = activeVariation?.moves.length ?? 0;
  const isInteractive = status === "playing";

  // Compute the move index for highlighting in MoveHistory
  // currentMoveIndex points to the NEXT move to play, so highlight the last played (index - 1)
  const historyHighlightIndex =
    activeVariation && currentMoveIndex > 0 ? currentMoveIndex - 1 : undefined;

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/train/opening")}
          aria-label="Back to openings"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          {opening.name}
        </h1>
        <Badge variant="outline" className="font-mono text-xs">
          {opening.eco}
        </Badge>
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
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

          {/* Trainer feedback */}
          <div className="w-full max-w-[36rem]">
            <TrainerFeedback
              status={status}
              currentMoveIndex={currentMoveIndex}
              totalMoves={totalMoves}
              annotation={currentAnnotation}
              wrongAttempts={wrongAttempts}
              playerColor={playerColor}
              onRetry={retryVariation}
              onHint={showHint}
            />
          </div>

          {/* Move history */}
          <div className="w-full max-w-[36rem] rounded-lg border bg-card px-3 py-2">
            <MoveHistory
              moves={moveHistory}
              currentMoveIndex={historyHighlightIndex}
            />
          </div>
        </div>

        {/* Right: Variations + Key Ideas + Chat */}
        <div className="min-h-[400px] flex-1 space-y-4 border-t p-4 lg:border-l lg:border-t-0">
          {/* Variation tree */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-3 text-sm font-semibold text-foreground">
              Variations
            </h3>
            <VariationTree
              variations={opening.variations}
              activeVariationId={activeVariation?.id ?? null}
              completedVariations={completedVariations}
              onSelectVariation={startVariation}
            />
          </div>

          {/* Key ideas */}
          <div className="rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Key Ideas
            </h3>
            <ul className="space-y-1">
              {opening.keyIdeas.map((idea) => (
                <li
                  key={idea}
                  className="text-xs text-muted-foreground"
                >
                  &bull; {idea}
                </li>
              ))}
            </ul>
          </div>

          {/* Chat panel */}
          <ChatPanel />
        </div>
      </div>
    </div>
  );
}
