"use client";

import { useProgressStore } from "@/stores/progressStore";
import type { ReviewUrgency } from "@/lib/spaced-repetition";

interface SpacedRepetitionProps {
  openingId: string;
  variationId: string;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = timestamp - now.getTime();
  const diffDays = Math.round(diffMs / 86_400_000);

  if (diffDays <= 0) return "Now";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays <= 7) return `In ${diffDays} days`;
  return date.toLocaleDateString();
}

function urgencyLabel(urgency: ReviewUrgency | "new"): string {
  switch (urgency) {
    case "new":
      return "New";
    case "overdue":
      return "Overdue";
    case "due-today":
      return "Due today";
    case "upcoming":
      return "Upcoming";
    case "not-due":
      return "Learned";
  }
}

function urgencyColor(urgency: ReviewUrgency | "new"): string {
  switch (urgency) {
    case "new":
      return "text-blue-500";
    case "overdue":
      return "text-red-500";
    case "due-today":
      return "text-orange-500";
    case "upcoming":
      return "text-yellow-500";
    case "not-due":
      return "text-green-500";
  }
}

export function SpacedRepetition({
  openingId,
  variationId,
}: SpacedRepetitionProps) {
  const variations = useProgressStore((s) => s.variations);
  const streakDays = useProgressStore((s) => s.streakDays);

  const key = `${openingId}:${variationId}`;
  const progress = variations[key];

  if (!progress) {
    return (
      <div className="rounded-lg border bg-card p-4" data-testid="sr-panel">
        <h3 className="mb-2 text-sm font-semibold text-foreground">
          Spaced Repetition
        </h3>
        <p className="text-xs text-muted-foreground">
          Complete this variation to start tracking progress.
        </p>
      </div>
    );
  }

  const urgency = useProgressStore
    .getState()
    .getVariationUrgency(openingId, variationId);

  const dueReviews = useProgressStore.getState().getDueReviews();
  const dueCount = dueReviews.length;

  return (
    <div className="rounded-lg border bg-card p-4" data-testid="sr-panel">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Spaced Repetition
      </h3>

      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Status</span>
          <span className={`font-medium ${urgencyColor(urgency)}`}>
            {urgencyLabel(urgency)}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Next review</span>
          <span className="font-medium">{formatDate(progress.nextReview)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Ease factor</span>
          <span className="font-mono">{progress.easeFactor.toFixed(2)}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Repetitions</span>
          <span className="font-mono">{progress.repetitions}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-muted-foreground">Interval</span>
          <span className="font-mono">
            {progress.interval} day{progress.interval !== 1 ? "s" : ""}
          </span>
        </div>

        {streakDays > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Streak</span>
            <span className="font-mono">
              {streakDays} day{streakDays !== 1 ? "s" : ""}
            </span>
          </div>
        )}

        {dueCount > 0 && (
          <div className="mt-2 rounded bg-orange-500/10 px-2 py-1 text-center text-orange-500">
            {dueCount} variation{dueCount !== 1 ? "s" : ""} due for review
          </div>
        )}
      </div>
    </div>
  );
}
