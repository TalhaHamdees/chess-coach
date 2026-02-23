import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchLichessExplorer,
  getTotalGames,
  getMoveWinRate,
  clearLichessCache,
  _resetForTesting,
} from "./lichess";
import type { LichessExplorerResponse, LichessMove } from "./lichess";

function makeResponse(
  overrides: Partial<LichessExplorerResponse> = {}
): LichessExplorerResponse {
  return {
    white: 5000,
    draws: 3000,
    black: 2000,
    moves: [
      {
        uci: "e2e4",
        san: "e4",
        white: 3000,
        draws: 1500,
        black: 500,
        averageRating: 1800,
      },
      {
        uci: "d2d4",
        san: "d4",
        white: 2000,
        draws: 1500,
        black: 1500,
        averageRating: 1900,
      },
    ],
    topGames: [],
    opening: null,
    ...overrides,
  };
}

const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

function mockFetchOk(data: LichessExplorerResponse) {
  vi.mocked(fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data),
  } as Response);
}

describe("lichess", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
    _resetForTesting();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("fetchLichessExplorer", () => {
    it("fetches from Lichess Explorer API", async () => {
      mockFetchOk(makeResponse());

      const result = await fetchLichessExplorer(START_FEN);

      expect(fetch).toHaveBeenCalledOnce();
      expect(result.moves).toHaveLength(2);
      expect(result.moves[0].san).toBe("e4");
    });

    it("includes default speed and rating params", async () => {
      mockFetchOk(makeResponse());

      await fetchLichessExplorer(START_FEN);

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("speeds=rapid%2Cclassical");
      expect(calledUrl).toContain("ratings=1600%2C1800%2C2000%2C2200%2C2500");
    });

    it("uses custom options when provided", async () => {
      mockFetchOk(makeResponse());

      await fetchLichessExplorer(START_FEN, {
        speeds: ["blitz"],
        ratings: ["2000"],
      });

      const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
      expect(calledUrl).toContain("speeds=blitz");
      expect(calledUrl).toContain("ratings=2000");
    });

    it("throws on non-ok response", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
      } as Response);

      await expect(fetchLichessExplorer(START_FEN)).rejects.toThrow(
        "Lichess Explorer error: 429"
      );
    });

    it("returns cached data on second call", async () => {
      mockFetchOk(makeResponse());

      const result1 = await fetchLichessExplorer(START_FEN);

      // Advance time but less than cache TTL (also past rate limit)
      vi.advanceTimersByTime(60_000);

      const result2 = await fetchLichessExplorer(START_FEN);

      // Should only have fetched once — second call served from cache
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it("re-fetches after cache TTL expires", async () => {
      const mockData = makeResponse();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      await fetchLichessExplorer(START_FEN);

      // Advance past 5-min TTL (also past rate limit)
      vi.advanceTimersByTime(6 * 60 * 1000);

      await fetchLichessExplorer(START_FEN);

      expect(fetch).toHaveBeenCalledTimes(2);
    });

    it("enforces rate limit between requests", async () => {
      const mockData = makeResponse();
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockData),
      } as Response);

      // First request
      await fetchLichessExplorer(START_FEN);

      // Second request with different FEN (to bypass cache) — should be delayed
      const otherFen =
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
      mockFetchOk(makeResponse());

      const promise2 = fetchLichessExplorer(otherFen);

      // Advance past the rate limit delay
      await vi.advanceTimersByTimeAsync(1100);
      await promise2;

      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTotalGames", () => {
    it("returns sum of white, draws, and black", () => {
      const response = makeResponse({ white: 100, draws: 50, black: 50 });
      expect(getTotalGames(response)).toBe(200);
    });

    it("returns 0 for empty response", () => {
      const response = makeResponse({ white: 0, draws: 0, black: 0 });
      expect(getTotalGames(response)).toBe(0);
    });
  });

  describe("getMoveWinRate", () => {
    const move: LichessMove = {
      uci: "e2e4",
      san: "e4",
      white: 600,
      draws: 300,
      black: 100,
      averageRating: 1800,
    };

    it("calculates win rate for white", () => {
      expect(getMoveWinRate(move, "w")).toBeCloseTo(0.6);
    });

    it("calculates win rate for black", () => {
      expect(getMoveWinRate(move, "b")).toBeCloseTo(0.1);
    });

    it("returns 0 for a move with no games", () => {
      const emptyMove: LichessMove = {
        uci: "a2a3",
        san: "a3",
        white: 0,
        draws: 0,
        black: 0,
        averageRating: 0,
      };
      expect(getMoveWinRate(emptyMove, "w")).toBe(0);
    });
  });

  describe("clearLichessCache", () => {
    it("clears the cache so next fetch hits the network", async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(makeResponse()),
      } as Response);

      await fetchLichessExplorer(START_FEN);
      expect(fetch).toHaveBeenCalledTimes(1);

      clearLichessCache();

      // Advance past rate limit
      vi.advanceTimersByTime(1100);

      await fetchLichessExplorer(START_FEN);
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
