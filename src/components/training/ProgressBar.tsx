"use client";

import { useProgressStore } from "@/stores/progressStore";
import { isReviewDue } from "@/lib/spaced-repetition";

interface ProgressBarProps {
  openingId: string;
  totalVariations: number;
}

export function ProgressBar({ openingId, totalVariations }: ProgressBarProps) {
  const variations = useProgressStore((s) => s.variations);

  const prefix = `${openingId}:`;
  const entries = Object.entries(variations).filter(([key]) =>
    key.startsWith(prefix)
  );

  let learned = 0;
  let due = 0;
  for (const [, progress] of entries) {
    if (isReviewDue(progress.nextReview)) {
      due++;
    } else {
      learned++;
    }
  }
  const notPracticed = totalVariations - learned - due;

  if (totalVariations === 0) return null;

  const learnedPct = (learned / totalVariations) * 100;
  const duePct = (due / totalVariations) * 100;
  const notPracticedPct = (notPracticed / totalVariations) * 100;

  return (
    <div data-testid="progress-bar">
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {learnedPct > 0 && (
          <div
            className="bg-green-500 transition-all duration-300"
            style={{ width: `${learnedPct}%` }}
            data-testid="progress-learned"
          />
        )}
        {duePct > 0 && (
          <div
            className="bg-orange-500 transition-all duration-300"
            style={{ width: `${duePct}%` }}
            data-testid="progress-due"
          />
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {learned} learned, {due} due, {notPracticed} new
      </p>
    </div>
  );
}
