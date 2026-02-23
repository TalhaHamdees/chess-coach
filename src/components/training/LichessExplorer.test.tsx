import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { LichessExplorer } from "./LichessExplorer";
import * as lichessModule from "@/lib/lichess";
import type { LichessExplorerResponse } from "@/lib/lichess";

vi.mock("@/lib/lichess", async () => {
  const actual = await vi.importActual("@/lib/lichess");
  return {
    ...actual,
    fetchLichessExplorer: vi.fn(),
  };
});

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

describe("LichessExplorer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );
    render(<LichessExplorer fen={START_FEN} playerColor="w" />);
    expect(screen.getByText("Loading statistics...")).toBeInTheDocument();
  });

  it("renders move list on successful load", async () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockResolvedValue(
      makeResponse()
    );

    render(<LichessExplorer fen={START_FEN} playerColor="w" />);

    await waitFor(() => {
      expect(screen.getByText("e4")).toBeInTheDocument();
    });
    expect(screen.getByText("d4")).toBeInTheDocument();
  });

  it("shows total game count", async () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockResolvedValue(
      makeResponse()
    );

    render(<LichessExplorer fen={START_FEN} playerColor="w" />);

    await waitFor(() => {
      expect(screen.getByText("10.0k games")).toBeInTheDocument();
    });
  });

  it("shows win rate percentage", async () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockResolvedValue(
      makeResponse()
    );

    render(<LichessExplorer fen={START_FEN} playerColor="w" />);

    await waitFor(() => {
      expect(screen.getByText(/60% win/)).toBeInTheDocument();
    });
  });

  it("shows error state on fetch failure", async () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockRejectedValue(
      new Error("Network error")
    );

    render(<LichessExplorer fen={START_FEN} playerColor="w" />);

    await waitFor(() => {
      expect(
        screen.getByText("Failed to load explorer data.")
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when no games found", async () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockResolvedValue(
      makeResponse({ white: 0, draws: 0, black: 0, moves: [] })
    );

    render(<LichessExplorer fen={START_FEN} playerColor="w" />);

    await waitFor(() => {
      expect(
        screen.getByText("No games found for this position.")
      ).toBeInTheDocument();
    });
  });

  it("renders the title", async () => {
    vi.mocked(lichessModule.fetchLichessExplorer).mockResolvedValue(
      makeResponse()
    );
    render(<LichessExplorer fen={START_FEN} playerColor="w" />);
    expect(screen.getByText("Lichess Explorer")).toBeInTheDocument();
  });

  it("limits display to top 5 moves", async () => {
    const manyMoves = Array.from({ length: 8 }, (_, i) => ({
      uci: `a2a${i + 3}`,
      san: `a${i + 3}`,
      white: 100,
      draws: 50,
      black: 50,
      averageRating: 1800,
    }));

    vi.mocked(lichessModule.fetchLichessExplorer).mockResolvedValue(
      makeResponse({ moves: manyMoves })
    );

    render(<LichessExplorer fen={START_FEN} playerColor="w" />);

    await waitFor(() => {
      expect(screen.getByText("a3")).toBeInTheDocument();
    });

    // Only 5 moves shown
    const moveElements = screen.getAllByText(/^a\d$/);
    expect(moveElements.length).toBe(5);
  });
});
