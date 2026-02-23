import { create } from "zustand";
import type { OpeningProgress } from "@/types/progress";
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
  /** Load state from localStorage (call in useEffect for SSR safety) */
  hydrate: () => void;
}

export type ProgressStore = ProgressState & ProgressActions;

function makeKey(openingId: string, variationId: string): string {
  return `${openingId}:${variationId}`;
}

function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

function persist(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    const data = {
      variations: state.variations,
      streakDays: state.streakDays,
      lastActiveDate: state.lastActiveDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

function loadFromStorage(): Partial<ProgressState> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<ProgressState>;
  } catch {
    return null;
  }
}

const initialState: ProgressState = {
  variations: {},
  streakDays: 0,
  lastActiveDate: "",
  hydrated: false,
};

export const useProgressStore = create<ProgressStore>((set, get) => ({
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
    const newState = { ...get(), variations: newVariations };
    set({ variations: newVariations });
    persist(newState);

    // Also update streak
    get().updateStreak();
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
    const { lastActiveDate, streakDays } = get();

    if (lastActiveDate === today) return; // Already counted today

    let newStreak: number;

    if (!lastActiveDate) {
      newStreak = 1;
    } else {
      const lastDate = new Date(lastActiveDate);
      const todayDate = new Date(today);
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / 86_400_000);

      if (diffDays === 1) {
        newStreak = streakDays + 1;
      } else {
        newStreak = 1; // Streak broken
      }
    }

    set({ streakDays: newStreak, lastActiveDate: today });
    const newState = get();
    persist(newState);
  },

  hydrate: () => {
    if (get().hydrated) return;
    const stored = loadFromStorage();
    if (stored) {
      set({
        variations: stored.variations ?? {},
        streakDays: stored.streakDays ?? 0,
        lastActiveDate: stored.lastActiveDate ?? "",
        hydrated: true,
      });
    } else {
      set({ hydrated: true });
    }
  },
}));
