import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { OpeningProgress, TacticsProgress } from "@/types/progress";
import {
  calculateSM2,
  mapTrainerOutcomeToQuality,
  isReviewDue,
  getReviewUrgency,
  SM2_DEFAULTS,
} from "@/lib/spaced-repetition";
import type { ReviewUrgency } from "@/lib/spaced-repetition";

const STORAGE_KEY = "chess-coach:progress";

interface ProgressState {
  /** SM-2 progress keyed by "openingId:variationId" */
  variations: Record<string, OpeningProgress>;
  /** Tactics puzzle progress keyed by puzzleId */
  tacticsProgress: Record<string, TacticsProgress>;
  /** Endgame position progress keyed by positionId */
  endgameProgress: Record<string, { completed: boolean; wrongAttempts: number; hintsUsed: number; lastPracticed: number }>;
  /** Consecutive days of practice */
  streakDays: number;
  /** ISO date string of last active day (YYYY-MM-DD) */
  lastActiveDate: string;
  /** Whether store has been hydrated from localStorage */
  hydrated: boolean;
}

interface ProgressActions {
  /** Record a variation completion/attempt and update SM-2 schedule */
  recordVariationCompletion: (
    openingId: string,
    variationId: string,
    totalMoves: number,
    wrongAttempts: number
  ) => void;
  /** Record a tactics puzzle completion */
  recordTacticsCompletion: (
    puzzleId: string,
    wrongAttempts: number,
    hintsUsed: number,
    timeSpent: number
  ) => void;
  /** Record an endgame position completion */
  recordEndgameCompletion: (
    positionId: string,
    wrongAttempts: number,
    hintsUsed: number
  ) => void;
  /** Get tactics progress for a puzzle */
  getTacticsProgress: (puzzleId: string) => TacticsProgress | undefined;
  /** Get count of solved tactics puzzles */
  getSolvedTacticsCount: () => number;
  /** Check if an endgame position has been completed */
  isEndgameCompleted: (positionId: string) => boolean;
  /** Get count of completed endgame positions */
  getCompletedEndgameCount: () => number;
  /** Get all variation progress entries for an opening */
  getOpeningProgress: (openingId: string) => OpeningProgress[];
  /** Get all variations that are due for review, sorted most-overdue first */
  getDueReviews: () => OpeningProgress[];
  /** Count of due-for-review variations in an opening */
  getOpeningDueCount: (openingId: string) => number;
  /** Whether any variation in an opening is due for review */
  isOpeningDueForReview: (openingId: string) => boolean;
  /** Get urgency level for a specific variation, or "new" if never practiced */
  getVariationUrgency: (
    openingId: string,
    variationId: string
  ) => ReviewUrgency | "new";
  /** Update consecutive day streak */
  updateStreak: () => void;
  /** Backwards-compatible hydrate — simply sets hydrated: true (persist middleware auto-hydrates) */
  hydrate: () => void;
}

export type ProgressStore = ProgressState & ProgressActions;

function makeKey(openingId: string, variationId: string): string {
  return `${openingId}:${variationId}`;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

const initialState: ProgressState = {
  variations: {},
  tacticsProgress: {},
  endgameProgress: {},
  streakDays: 0,
  lastActiveDate: "",
  hydrated: false,
};

export const useProgressStore = create<ProgressStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      recordVariationCompletion: (
        openingId,
        variationId,
        totalMoves,
        wrongAttempts
      ) => {
        const key = makeKey(openingId, variationId);
        const existing = get().variations[key];
        const quality = mapTrainerOutcomeToQuality(wrongAttempts, true);

        const sm2Input = {
          quality,
          easeFactor: existing?.easeFactor ?? SM2_DEFAULTS.easeFactor,
          interval: existing?.interval ?? SM2_DEFAULTS.interval,
          repetitions: existing?.repetitions ?? SM2_DEFAULTS.repetitions,
        };

        const sm2Result = calculateSM2(sm2Input);

        const progress: OpeningProgress = {
          openingId,
          variationId,
          completedMoves: totalMoves,
          totalMoves,
          lastPracticed: Date.now(),
          nextReview: sm2Result.nextReview,
          easeFactor: sm2Result.easeFactor,
          interval: sm2Result.interval,
          repetitions: sm2Result.repetitions,
        };

        const newVariations = { ...get().variations, [key]: progress };
        set({ variations: newVariations });

        // Also update streak
        get().updateStreak();
      },

      recordTacticsCompletion: (puzzleId, wrongAttempts, hintsUsed, timeSpent) => {
        const existing = get().tacticsProgress[puzzleId];
        const progress: TacticsProgress = {
          puzzleId,
          solved: true,
          attempts: (existing?.attempts ?? 0) + 1,
          hintsUsed,
          timeSpent,
          lastAttempted: Date.now(),
        };
        const newTactics = { ...get().tacticsProgress, [puzzleId]: progress };
        set({ tacticsProgress: newTactics });
        get().updateStreak();
      },

      recordEndgameCompletion: (positionId, wrongAttempts, hintsUsed) => {
        const progress = {
          completed: true,
          wrongAttempts,
          hintsUsed,
          lastPracticed: Date.now(),
        };
        const newEndgame = { ...get().endgameProgress, [positionId]: progress };
        set({ endgameProgress: newEndgame });
        get().updateStreak();
      },

      getTacticsProgress: (puzzleId) => {
        return get().tacticsProgress[puzzleId];
      },

      getSolvedTacticsCount: () => {
        return Object.values(get().tacticsProgress).filter((p) => p.solved).length;
      },

      isEndgameCompleted: (positionId) => {
        return get().endgameProgress[positionId]?.completed ?? false;
      },

      getCompletedEndgameCount: () => {
        return Object.values(get().endgameProgress).filter((p) => p.completed).length;
      },

      getOpeningProgress: (openingId) => {
        const prefix = `${openingId}:`;
        return Object.entries(get().variations)
          .filter(([key]) => key.startsWith(prefix))
          .map(([, progress]) => progress);
      },

      getDueReviews: () => {
        return Object.values(get().variations)
          .filter((p) => isReviewDue(p.nextReview))
          .sort((a, b) => a.nextReview - b.nextReview);
      },

      getOpeningDueCount: (openingId) => {
        const prefix = `${openingId}:`;
        return Object.entries(get().variations).filter(
          ([key, progress]) =>
            key.startsWith(prefix) && isReviewDue(progress.nextReview)
        ).length;
      },

      isOpeningDueForReview: (openingId) => {
        return get().getOpeningDueCount(openingId) > 0;
      },

      getVariationUrgency: (openingId, variationId) => {
        const key = makeKey(openingId, variationId);
        const progress = get().variations[key];
        if (!progress) return "new";
        return getReviewUrgency(progress.nextReview);
      },

      updateStreak: () => {
        const today = getTodayString();

        // Use functional set() to prevent race conditions from concurrent calls
        set((state) => {
          if (state.lastActiveDate === today) return state; // Already counted today

          let newStreak: number;

          if (!state.lastActiveDate) {
            newStreak = 1;
          } else {
            const lastDate = new Date(state.lastActiveDate);
            const todayDate = new Date(today);
            const diffMs = todayDate.getTime() - lastDate.getTime();
            const diffDays = Math.round(diffMs / 86_400_000);

            if (diffDays === 1) {
              newStreak = state.streakDays + 1;
            } else {
              newStreak = 1; // Streak broken
            }
          }

          return { streakDays: newStreak, lastActiveDate: today };
        });
      },

      hydrate: () => {
        if (get().hydrated) return;
        useProgressStore.persist.rehydrate();
      },
    }),
    {
      name: STORAGE_KEY,
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (str === null) return null;
            const parsed = JSON.parse(str);
            // Support both old flat format and new {state, version} format
            if (parsed && typeof parsed === "object" && "state" in parsed) {
              return parsed;
            }
            // Wrap old flat format for persist middleware compatibility
            return { state: parsed, version: 0 };
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          // Store in flat format (without {state, version} wrapper) for backwards compatibility
          const data = value && typeof value === "object" && "state" in value
            ? (value as { state: unknown }).state
            : value;
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
      partialize: (state) => {
        // Exclude hydrated flag from persistence
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hydrated: _, ...rest } = state;
        return rest as unknown as ProgressStore;
      },
      onRehydrateStorage: () => {
        return (_state, error) => {
          if (!error) {
            useProgressStore.setState({ hydrated: true });
          }
        };
      },
    }
  )
);
