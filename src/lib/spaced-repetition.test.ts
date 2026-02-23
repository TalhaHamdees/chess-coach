import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateSM2,
  mapTrainerOutcomeToQuality,
  isReviewDue,
  getReviewUrgency,
  SM2_DEFAULTS,
} from "./spaced-repetition";

const MS_PER_DAY = 86_400_000;

describe("spaced-repetition", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("SM2_DEFAULTS", () => {
    it("has correct default values", () => {
      expect(SM2_DEFAULTS.easeFactor).toBe(2.5);
      expect(SM2_DEFAULTS.interval).toBe(0);
      expect(SM2_DEFAULTS.repetitions).toBe(0);
    });
  });

  describe("calculateSM2", () => {
    it("sets interval to 1 day on first successful review", () => {
      const result = calculateSM2({
        quality: 5,
        ...SM2_DEFAULTS,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(1);
    });

    it("sets interval to 6 days on second successful review", () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });
      expect(result.interval).toBe(6);
      expect(result.repetitions).toBe(2);
    });

    it("multiplies interval by ease factor on third+ review", () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.interval).toBe(15); // round(6 * 2.5) = 15
      expect(result.repetitions).toBe(3);
    });

    it("resets interval to 1 and repetitions to 0 on quality < 3", () => {
      const result = calculateSM2({
        quality: 2,
        easeFactor: 2.5,
        interval: 15,
        repetitions: 3,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it("never lets ease factor drop below 1.3", () => {
      const result = calculateSM2({
        quality: 0,
        easeFactor: 1.3,
        interval: 1,
        repetitions: 1,
      });
      expect(result.easeFactor).toBe(1.3);
    });

    it("increases ease factor for perfect quality", () => {
      const result = calculateSM2({
        quality: 5,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 1,
      });
      expect(result.easeFactor).toBe(2.6);
    });

    it("decreases ease factor for low quality", () => {
      const result = calculateSM2({
        quality: 3,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      expect(result.easeFactor).toBe(2.36);
    });

    it("computes nextReview as now + interval days", () => {
      const result = calculateSM2({
        quality: 5,
        ...SM2_DEFAULTS,
      });
      const expected = Date.now() + 1 * MS_PER_DAY;
      expect(result.nextReview).toBe(expected);
    });

    it("handles quality 0 (complete blackout)", () => {
      const result = calculateSM2({
        quality: 0,
        easeFactor: 2.5,
        interval: 30,
        repetitions: 5,
      });
      expect(result.interval).toBe(1);
      expect(result.repetitions).toBe(0);
    });

    it("rounds ease factor to 2 decimal places", () => {
      const result = calculateSM2({
        quality: 4,
        easeFactor: 2.5,
        interval: 6,
        repetitions: 2,
      });
      // EF = 2.5 + (0.1 - 1*(0.08 + 1*0.02)) = 2.5 + 0.0 = 2.5
      expect(result.easeFactor).toBe(2.5);
    });
  });

  describe("mapTrainerOutcomeToQuality", () => {
    it("returns 5 for 0 wrong attempts and completed", () => {
      expect(mapTrainerOutcomeToQuality(0, true)).toBe(5);
    });

    it("returns 4 for 1 wrong attempt and completed", () => {
      expect(mapTrainerOutcomeToQuality(1, true)).toBe(4);
    });

    it("returns 3 for 2 wrong attempts and completed", () => {
      expect(mapTrainerOutcomeToQuality(2, true)).toBe(3);
    });

    it("returns 2 for 3+ wrong attempts and completed", () => {
      expect(mapTrainerOutcomeToQuality(3, true)).toBe(2);
      expect(mapTrainerOutcomeToQuality(10, true)).toBe(2);
    });

    it("returns 1 for abandoned (not completed)", () => {
      expect(mapTrainerOutcomeToQuality(0, false)).toBe(1);
      expect(mapTrainerOutcomeToQuality(5, false)).toBe(1);
    });
  });

  describe("isReviewDue", () => {
    it("returns true when nextReview is in the past", () => {
      expect(isReviewDue(Date.now() - 1000)).toBe(true);
    });

    it("returns true when nextReview is exactly now", () => {
      expect(isReviewDue(Date.now())).toBe(true);
    });

    it("returns false when nextReview is in the future", () => {
      expect(isReviewDue(Date.now() + 1000)).toBe(false);
    });
  });

  describe("getReviewUrgency", () => {
    it('returns "overdue" when more than 1 day past', () => {
      expect(getReviewUrgency(Date.now() - 2 * MS_PER_DAY)).toBe("overdue");
    });

    it('returns "due-today" when past but within 1 day', () => {
      expect(getReviewUrgency(Date.now() - 1000)).toBe("due-today");
    });

    it('returns "due-today" when exactly now', () => {
      expect(getReviewUrgency(Date.now())).toBe("due-today");
    });

    it('returns "upcoming" when within next 3 days', () => {
      expect(getReviewUrgency(Date.now() + MS_PER_DAY)).toBe("upcoming");
      expect(getReviewUrgency(Date.now() + 2 * MS_PER_DAY)).toBe("upcoming");
    });

    it('returns "not-due" when more than 3 days away', () => {
      expect(getReviewUrgency(Date.now() + 4 * MS_PER_DAY)).toBe("not-due");
    });
  });
});
