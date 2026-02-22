/** Opening study progress */
export interface OpeningProgress {
  openingId: string;
  variationId: string;
  completedMoves: number;
  totalMoves: number;
  lastPracticed: number;
  nextReview: number;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

/** Tactics puzzle progress */
export interface TacticsProgress {
  puzzleId: string;
  solved: boolean;
  attempts: number;
  hintsUsed: number;
  timeSpent: number;
  lastAttempted: number;
}

/** Overall user progress */
export interface UserProgress {
  openings: Record<string, OpeningProgress>;
  tactics: TacticsProgress[];
  totalPuzzlesSolved: number;
  totalOpeningsLearned: number;
  streakDays: number;
  lastActiveDate: string;
}

/** Spaced repetition review quality (SM-2 algorithm) */
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5;
