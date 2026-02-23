"use client";

import { Button } from "@/components/ui/button";
import type { TrainerStatus } from "@/stores/openingTrainerStore";
import type { PieceColor } from "@/types/chess";

interface TrainerFeedbackProps {
  status: TrainerStatus;
  currentMoveIndex: number;
  totalMoves: number;
  annotation: string | null;
  wrongAttempts: number;
  playerColor: PieceColor;
  onRetry: () => void;
  onHint: () => void;
}

function getStatusMessage(status: TrainerStatus, playerColor: PieceColor): string {
  switch (status) {
    case "idle":
      return "Select a variation to start practicing";
    case "playing":
      return "Your turn — find the correct move";
    case "opponent-moving":
      return "Opponent is playing...";
    case "wrong-move":
      return "Not quite — try again!";
    case "completed":
      return "Variation completed!";
  }
}

function getStatusColor(status: TrainerStatus): string {
  switch (status) {
    case "idle":
      return "text-muted-foreground";
    case "playing":
      return "text-foreground";
    case "opponent-moving":
      return "text-muted-foreground";
    case "wrong-move":
      return "text-red-500";
    case "completed":
      return "text-green-500";
  }
}

export function TrainerFeedback({
  status,
  currentMoveIndex,
  totalMoves,
  annotation,
  wrongAttempts,
  playerColor,
  onRetry,
  onHint,
}: TrainerFeedbackProps) {
  const isActive = status !== "idle";
  const progressText = isActive
    ? `Move ${Math.min(currentMoveIndex + 1, totalMoves)} of ${totalMoves}`
    : null;

  return (
    <div className="rounded-lg border bg-card p-3 space-y-2">
      {/* Status line */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-medium ${getStatusColor(status)}`}>
          {getStatusMessage(status, playerColor)}
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

      {/* Annotation */}
      {annotation && (
        <p className="text-xs text-muted-foreground italic">{annotation}</p>
      )}

      {/* Wrong attempt counter */}
      {wrongAttempts > 0 && status !== "completed" && (
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
          {status === "playing" && (
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
