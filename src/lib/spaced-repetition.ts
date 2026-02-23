import type { ReviewQuality } from "@/types/progress";

/** SM-2 algorithm input */
export interface SM2Input {
  quality: ReviewQuality;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

/** SM-2 algorithm output */
export interface SM2Result {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}

/** Default values for a brand-new card */
export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
} as const;

const MS_PER_DAY = 86_400_000;

/**
 * Core SM-2 spaced repetition algorithm.
 *
 * Quality < 3: reset interval to 1 day and repetitions to 0 (failed recall).
 * Quality >= 3: grow interval based on ease factor.
 * Ease factor minimum is 1.3.
 */
export function calculateSM2(input: SM2Input): SM2Result {
  const { quality, easeFactor, interval, repetitions } = input;

  let newEF =
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEF < 1.3) newEF = 1.3;

  let newInterval: number;
  let newReps: number;

  if (quality < 3) {
    // Failed recall — reset
    newInterval = 1;
    newReps = 0;
  } else {
    newReps = repetitions + 1;
    if (newReps === 1) {
      newInterval = 1;
    } else if (newReps === 2) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * newEF);
    }
  }

  const nextReview = Date.now() + newInterval * MS_PER_DAY;

  return {
    easeFactor: Math.round(newEF * 100) / 100,
    interval: newInterval,
    repetitions: newReps,
    nextReview,
  };
}

/**
 * Maps trainer outcomes to SM-2 quality score (0-5).
 *
 * 0 wrong attempts, completed → 5 (perfect)
 * 1 wrong attempt  → 4 (correct after hesitation)
 * 2 wrong attempts → 3 (correct with difficulty)
 * 3+ wrong attempts → 2 (barely recalled)
 * Not completed (abandoned) → 1 (failed)
 */
export function mapTrainerOutcomeToQuality(
  wrongAttempts: number,
  completed: boolean
): ReviewQuality {
  if (!completed) return 1;
  if (wrongAttempts === 0) return 5;
  if (wrongAttempts === 1) return 4;
  if (wrongAttempts === 2) return 3;
  return 2;
}

/**
 * Whether a review is currently due.
 */
export function isReviewDue(nextReview: number): boolean {
  return Date.now() >= nextReview;
}

/** Review urgency levels */
export type ReviewUrgency = "overdue" | "due-today" | "upcoming" | "not-due";

/**
 * Returns the urgency level for a review.
 *
 * - overdue: past the review date by more than 1 day
 * - due-today: within the current day window
 * - upcoming: due within the next 3 days
 * - not-due: more than 3 days away
 */
export function getReviewUrgency(nextReview: number): ReviewUrgency {
  const now = Date.now();
  const diff = nextReview - now;

  if (diff < -MS_PER_DAY) return "overdue";
  if (diff <= 0) return "due-today";
  if (diff <= 3 * MS_PER_DAY) return "upcoming";
  return "not-due";
}
