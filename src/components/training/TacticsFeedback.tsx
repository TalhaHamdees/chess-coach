"use client";

import { Button } from "@/components/ui/button";
import type { TacticsStatus } from "@/stores/tacticsStore";
import type { PieceColor } from "@/types/chess";

interface TacticsFeedbackProps {
  status: TacticsStatus;
  currentMoveIndex: number;
  totalMoves: number;
  hintText: string | null;
  wrongAttempts: number;
  playerColor: PieceColor;
  onRetry: () => void;
  onHint: () => void;
}

function getStatusMessage(status: TacticsStatus): string {
  switch (status) {
    case "idle":
      return "Select a puzzle to start solving";
    case "solving":
      return "Find the best move!";
    case "opponent-moving":
      return "Opponent is responding...";
    case "wrong-move":
      return "Not the best move — try again!";
    case "solved":
      return "Puzzle solved!";
    case "showing-hint":
      return "Here's a hint...";
  }
}

function getStatusColor(status: TacticsStatus): string {
  switch (status) {
    case "idle":
      return "text-muted-foreground";
    case "solving":
      return "text-foreground";
    case "opponent-moving":
      return "text-muted-foreground";
    case "wrong-move":
      return "text-red-500";
    case "solved":
      return "text-green-500";
    case "showing-hint":
      return "text-blue-500";
  }
}

export function TacticsFeedback({
  status,
  currentMoveIndex,
  totalMoves,
  hintText,
  wrongAttempts,
  playerColor,
  onRetry,
  onHint,
}: TacticsFeedbackProps) {
  const isActive = status !== "idle";
  const playerMoveCount = Math.ceil(totalMoves / 2);
  const currentPlayerMove = Math.ceil((currentMoveIndex + 1) / 2);
  const progressText = isActive
    ? `Move ${Math.min(currentPlayerMove, playerMoveCount)} of ${playerMoveCount}`
    : null;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* Status line */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
          {getStatusMessage(status)}
        </span>
        {progressText && (
          <span className="text-xs text-muted-foreground shrink-0">
            {progressText}
          </span>
        )}
      </div>

      {/* Progress bar */}
      {isActive && totalMoves > 0 && (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{
              width: `${(Math.min(currentMoveIndex, totalMoves) / totalMoves) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Hint text */}
      {hintText && (
        <p className="text-xs text-muted-foreground italic">{hintText}</p>
      )}

      {/* Wrong attempt counter */}
      {wrongAttempts > 0 && status !== "solved" && (
        <p className="text-xs text-red-400">
          Wrong attempts: {wrongAttempts}
        </p>
      )}

      {/* Action buttons */}
      {isActive && (
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="text-xs"
          >
            Retry
          </Button>
          {(status === "solving" || status === "showing-hint") && (
            <Button
              variant="outline"
              size="sm"
              onClick={onHint}
              className="text-xs"
            >
              Hint
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
