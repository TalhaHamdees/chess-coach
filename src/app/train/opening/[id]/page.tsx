"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useGameStore } from "@/stores/gameStore";
import { useCoachStore } from "@/stores/coachStore";
import { ChessBoard } from "@/components/board/ChessBoard";
import { MoveHistory } from "@/components/board/MoveHistory";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getOpeningById } from "@/lib/data/openings";

export default function OpeningTrainerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const opening = getOpeningById(params.id);

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
    if (!opening) return;

    // Set board to opening position
    reset(opening.startingFen);

    // Flip board if student plays Black
    if (opening.playerColor === "b") {
      // Only flip if not already flipped
      const currentFlipped = useGameStore.getState().flipped;
      if (!currentFlipped) flipBoard();
    } else {
      const currentFlipped = useGameStore.getState().flipped;
      if (currentFlipped) flipBoard();
    }

    // Configure coach mode
    setMode("opening-trainer");
    clearChat();

    return () => {
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
        {/* Left: Board + info */}
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

          {/* Opening info panel */}
          <div className="w-full max-w-[36rem] rounded-lg border bg-card p-4">
            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Key Ideas
            </h3>
            <ul className="mb-3 space-y-1">
              {opening.keyIdeas.map((idea) => (
                <li
                  key={idea}
                  className="text-xs text-muted-foreground"
                >
                  &bull; {idea}
                </li>
              ))}
            </ul>

            <h3 className="mb-2 text-sm font-semibold text-foreground">
              Variations
            </h3>
            <ul className="space-y-1">
              {opening.variations.map((variation) => (
                <li
                  key={variation.id}
                  className="text-xs text-muted-foreground"
                >
                  &bull; {variation.name} ({variation.moves.length} moves)
                </li>
              ))}
            </ul>
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
