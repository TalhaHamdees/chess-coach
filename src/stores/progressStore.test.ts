import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useProgressStore } from "./progressStore";
import type { ProgressStore } from "./progressStore";

const MS_PER_DAY = 86_400_000;

function getStore(): ProgressStore {
  return useProgressStore.getState();
}

// Mock localStorage
const localStorageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageMock[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageMock[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageMock[key];
  }),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(globalThis, "localStorage", { value: mockLocalStorage });

describe("progressStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
    // Reset store to initial state
    useProgressStore.setState({
      variations: {},
      streakDays: 0,
      lastActiveDate: "",
      hydrated: false,
    });
    // Clear mock localStorage
    for (const key of Object.keys(localStorageMock)) {
      delete localStorageMock[key];
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("recordVariationCompletion", () => {
    it("creates a new progress entry for a first-time completion", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      const progress = getStore().variations["italian-game:giuoco-piano"];
      expect(progress).toBeDefined();
      expect(progress.openingId).toBe("italian-game");
      expect(progress.variationId).toBe("giuoco-piano");
      expect(progress.totalMoves).toBe(6);
      expect(progress.completedMoves).toBe(6);
      expect(progress.repetitions).toBe(1);
    });

    it("sets ease factor based on quality (perfect = 5)", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      const progress = getStore().variations["italian-game:giuoco-piano"];
      // Quality 5 with default EF 2.5 → EF = 2.6
      expect(progress.easeFactor).toBe(2.6);
    });

    it("sets interval to 1 day on first review", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      const progress = getStore().variations["italian-game:giuoco-piano"];
      expect(progress.interval).toBe(1);
    });

    it("sets nextReview to 1 day from now on first review", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      const progress = getStore().variations["italian-game:giuoco-piano"];
      expect(progress.nextReview).toBe(Date.now() + MS_PER_DAY);
    });

    it("updates an existing entry on second completion", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      // Advance 1 day
      vi.advanceTimersByTime(MS_PER_DAY);

      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 1);

      const progress = getStore().variations["italian-game:giuoco-piano"];
      expect(progress.repetitions).toBe(2);
      expect(progress.interval).toBe(6);
    });

    it("resets on poor quality (3+ wrong attempts = quality 2)", () => {
      // First review
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      // Advance and do poorly
      vi.advanceTimersByTime(MS_PER_DAY);
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 5);

      const progress = getStore().variations["italian-game:giuoco-piano"];
      // Quality 2 → reset
      expect(progress.interval).toBe(1);
      expect(progress.repetitions).toBe(0);
    });

    it("persists to localStorage", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "chess-coach:progress",
        expect.any(String)
      );

      const stored = JSON.parse(
        mockLocalStorage.setItem.mock.calls[0][1] as string
      );
      expect(stored.variations["italian-game:giuoco-piano"]).toBeDefined();
    });

    it("tracks multiple variations independently", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      getStore().recordVariationCompletion("italian-game", "two-knights", 4, 1);

      const vars = getStore().variations;
      expect(Object.keys(vars)).toHaveLength(2);
      expect(vars["italian-game:giuoco-piano"].repetitions).toBe(1);
      expect(vars["italian-game:two-knights"].repetitions).toBe(1);
    });
  });

  describe("getOpeningProgress", () => {
    it("returns all variation progress for an opening", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      getStore().recordVariationCompletion("italian-game", "two-knights", 4, 0);
      getStore().recordVariationCompletion("sicilian", "najdorf", 8, 0);

      const progress = getStore().getOpeningProgress("italian-game");
      expect(progress).toHaveLength(2);
      expect(progress.map((p) => p.variationId).sort()).toEqual([
        "giuoco-piano",
        "two-knights",
      ]);
    });

    it("returns empty array for unknown opening", () => {
      expect(getStore().getOpeningProgress("unknown")).toEqual([]);
    });
  });

  describe("getDueReviews", () => {
    it("returns variations past their review date, sorted most overdue first", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      getStore().recordVariationCompletion("sicilian", "najdorf", 8, 0);

      // Advance 2 days — both should be due (interval was 1 day)
      vi.advanceTimersByTime(2 * MS_PER_DAY);

      const due = getStore().getDueReviews();
      expect(due).toHaveLength(2);
      // Earlier nextReview should be first (most overdue)
      expect(due[0].nextReview).toBeLessThanOrEqual(due[1].nextReview);
    });

    it("returns empty when nothing is due", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      // Don't advance time — review is 1 day away
      expect(getStore().getDueReviews()).toEqual([]);
    });
  });

  describe("getOpeningDueCount", () => {
    it("counts due variations for an opening", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      getStore().recordVariationCompletion("italian-game", "two-knights", 4, 0);

      vi.advanceTimersByTime(2 * MS_PER_DAY);

      expect(getStore().getOpeningDueCount("italian-game")).toBe(2);
    });

    it("returns 0 when no variations are due", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      expect(getStore().getOpeningDueCount("italian-game")).toBe(0);
    });

    it("returns 0 for unknown opening", () => {
      expect(getStore().getOpeningDueCount("unknown")).toBe(0);
    });
  });

  describe("isOpeningDueForReview", () => {
    it("returns true when any variation is due", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      vi.advanceTimersByTime(2 * MS_PER_DAY);
      expect(getStore().isOpeningDueForReview("italian-game")).toBe(true);
    });

    it("returns false when no variation is due", () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      expect(getStore().isOpeningDueForReview("italian-game")).toBe(false);
    });
  });

  describe("getVariationUrgency", () => {
    it('returns "new" for never-practiced variations', () => {
      expect(getStore().getVariationUrgency("italian-game", "giuoco-piano")).toBe(
        "new"
      );
    });

    it('returns "upcoming" for recently completed (1-day interval is within 3-day window)', () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      expect(
        getStore().getVariationUrgency("italian-game", "giuoco-piano")
      ).toBe("upcoming");
    });

    it('returns "not-due" for well-scheduled variation', () => {
      // Do 3 reviews to get a longer interval (>3 days)
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      vi.advanceTimersByTime(MS_PER_DAY);
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      vi.advanceTimersByTime(6 * MS_PER_DAY);
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      // After 3rd review, interval should be ~16 days → "not-due"
      expect(
        getStore().getVariationUrgency("italian-game", "giuoco-piano")
      ).toBe("not-due");
    });

    it('returns "overdue" when well past review date', () => {
      getStore().recordVariationCompletion("italian-game", "giuoco-piano", 6, 0);
      vi.advanceTimersByTime(3 * MS_PER_DAY);
      expect(
        getStore().getVariationUrgency("italian-game", "giuoco-piano")
      ).toBe("overdue");
    });
  });

  describe("updateStreak", () => {
    it("starts streak at 1 on first activity", () => {
      getStore().updateStreak();
      expect(getStore().streakDays).toBe(1);
      expect(getStore().lastActiveDate).toBe("2026-02-23");
    });

    it("increments streak for consecutive days", () => {
      getStore().updateStreak();
      expect(getStore().streakDays).toBe(1);

      vi.advanceTimersByTime(MS_PER_DAY);
      getStore().updateStreak();
      expect(getStore().streakDays).toBe(2);
    });

    it("resets streak when a day is skipped", () => {
      getStore().updateStreak();
      expect(getStore().streakDays).toBe(1);

      vi.advanceTimersByTime(2 * MS_PER_DAY); // Skip a day
      getStore().updateStreak();
      expect(getStore().streakDays).toBe(1); // Reset to 1
    });

    it("does not double-count same day", () => {
      getStore().updateStreak();
      getStore().updateStreak();
      expect(getStore().streakDays).toBe(1);
    });
  });

  describe("hydrate", () => {
    it("loads state from localStorage", () => {
      const stored = {
        variations: {
          "italian-game:giuoco-piano": {
            openingId: "italian-game",
            variationId: "giuoco-piano",
            completedMoves: 6,
            totalMoves: 6,
            lastPracticed: Date.now() - MS_PER_DAY,
            nextReview: Date.now(),
            easeFactor: 2.6,
            interval: 1,
            repetitions: 1,
          },
        },
        streakDays: 3,
        lastActiveDate: "2026-02-22",
      };
      localStorageMock["chess-coach:progress"] = JSON.stringify(stored);

      getStore().hydrate();

      expect(getStore().hydrated).toBe(true);
      expect(getStore().streakDays).toBe(3);
      expect(
        getStore().variations["italian-game:giuoco-piano"]
      ).toBeDefined();
    });

    it("does nothing if already hydrated", () => {
      localStorageMock["chess-coach:progress"] = JSON.stringify({
        variations: {},
        streakDays: 5,
        lastActiveDate: "2026-02-22",
      });

      getStore().hydrate();
      expect(getStore().streakDays).toBe(5);

      // Change localStorage
      localStorageMock["chess-coach:progress"] = JSON.stringify({
        variations: {},
        streakDays: 99,
        lastActiveDate: "2026-02-22",
      });

      getStore().hydrate();
      // Should still be 5, not re-hydrated
      expect(getStore().streakDays).toBe(5);
    });

    it("handles empty localStorage gracefully", () => {
      getStore().hydrate();
      expect(getStore().hydrated).toBe(true);
      expect(getStore().variations).toEqual({});
      expect(getStore().streakDays).toBe(0);
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorageMock["chess-coach:progress"] = "not-valid-json";
      getStore().hydrate();
      expect(getStore().hydrated).toBe(true);
      expect(getStore().variations).toEqual({});
    });
  });
});
