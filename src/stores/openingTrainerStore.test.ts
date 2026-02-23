import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useOpeningTrainerStore } from "./openingTrainerStore";
import { useGameStore } from "./gameStore";
import { useProgressStore } from "./progressStore";
import type { OpeningTrainerStore } from "./openingTrainerStore";
import type { Opening, OpeningVariation } from "@/types/opening";

function getStore(): OpeningTrainerStore {
  return useOpeningTrainerStore.getState();
}

function makeOpening(overrides: Partial<Opening> = {}): Opening {
  return {
    id: "italian-game",
    name: "Italian Game",
    eco: "C50",
    category: "e4",
    difficulty: "beginner",
    description: "One of the oldest openings.",
    keyIdeas: ["Rapid development"],
    playerColor: "w",
    startingFen:
      "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    variations: [
      {
        id: "giuoco-piano",
        name: "Giuoco Piano",
        // Black plays Bc5, White plays c3, Black plays d6
        moves: [
          { moveNumber: 3, san: "Bc5", color: "b" },
          { moveNumber: 4, san: "c3", color: "w" },
          { moveNumber: 4, san: "d6", color: "b" },
        ],
        finalFen:
          "r1bqk1nr/ppp2ppp/2np4/2b1p3/2B1P3/2P2N2/PP1P1PPP/RNBQK2R w KQkq - 0 5",
      },
      {
        id: "two-knights",
        name: "Two Knights Defense",
        moves: [
          { moveNumber: 3, san: "Nf6", color: "b" },
          { moveNumber: 4, san: "d4", color: "w" },
        ],
        finalFen:
          "r1bqkb1r/pppp1ppp/2n2n2/4p3/2BPP3/5N2/PPP2PPP/RNBQK2R b KQkq - 0 4",
      },
    ],
    ...overrides,
  };
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

describe("openingTrainerStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getStore().cleanup();
    useGameStore.getState().reset();
    // Reset progress store
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

  describe("initial state", () => {
    it("starts with idle status", () => {
      expect(getStore().status).toBe("idle");
    });

    it("starts with no opening", () => {
      expect(getStore().opening).toBeNull();
    });

    it("starts with no active variation", () => {
      expect(getStore().activeVariation).toBeNull();
    });

    it("starts with no selection", () => {
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });
  });

  describe("initOpening", () => {
    it("sets the opening and player color", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);

      expect(getStore().opening).toBe(opening);
      expect(getStore().playerColor).toBe("w");
    });

    it("loads completed variations from localStorage", () => {
      const completed = { "giuoco-piano": true };
      localStorageMock["chess-coach:opening-progress:italian-game"] =
        JSON.stringify(completed);

      getStore().initOpening(makeOpening());
      expect(getStore().completedVariations).toEqual(completed);
    });

    it("starts with empty completedVariations if none saved", () => {
      getStore().initOpening(makeOpening());
      expect(getStore().completedVariations).toEqual({});
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorageMock["chess-coach:opening-progress:italian-game"] =
        "not-valid-json";

      getStore().initOpening(makeOpening());
      expect(getStore().completedVariations).toEqual({});
    });
  });

  describe("startVariation", () => {
    it("sets the active variation and status to playing", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");

      expect(getStore().activeVariation?.id).toBe("giuoco-piano");
      expect(getStore().currentMoveIndex).toBe(0);
    });

    it("resets the board to the opening starting FEN", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");

      expect(useGameStore.getState().fen).toBe(opening.startingFen);
    });

    it("auto-plays first move if it belongs to opponent (White opening, first move is Black)", () => {
      // Italian Game: playerColor=w, first variation move is Black's Bc5
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");

      // Before timer: status should be opponent-moving
      expect(getStore().status).toBe("opponent-moving");

      // After timer fires, opponent move is played
      vi.advanceTimersByTime(500);

      expect(getStore().status).toBe("playing");
      expect(getStore().currentMoveIndex).toBe(1);
      // Board should have moved — Black played Bc5
      expect(useGameStore.getState().moveHistory).toContain("Bc5");
    });

    it("sets status to playing immediately if first move is player's", () => {
      // Create an opening where player=black and first move is white (opponent)
      // Actually for player=b opening, first move by white is opponent -> should auto-play
      // Let's create a scenario where first move is player's:
      const opening = makeOpening({
        playerColor: "b",
        variations: [
          {
            id: "test-var",
            name: "Test",
            moves: [
              { moveNumber: 3, san: "Bc5", color: "b" },
            ],
            finalFen: "test",
          },
        ],
      });
      getStore().initOpening(opening);
      getStore().startVariation("test-var");

      // First move is Black (player's color), so should be playing immediately
      expect(getStore().status).toBe("playing");
    });

    it("does nothing if opening is not set", () => {
      getStore().startVariation("giuoco-piano");
      expect(getStore().activeVariation).toBeNull();
    });

    it("does nothing if variation ID is invalid", () => {
      getStore().initOpening(makeOpening());
      getStore().startVariation("nonexistent");
      expect(getStore().activeVariation).toBeNull();
    });

    it("resets wrongAttempts when starting a variation", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      expect(getStore().wrongAttempts).toBe(0);
    });
  });

  describe("handleSquareClick", () => {
    it("selects a player's piece and shows valid moves", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");

      // Wait for opponent move (Bc5)
      vi.advanceTimersByTime(500);
      expect(getStore().status).toBe("playing");

      // Now it's White's turn (player). Click on c3's pawn at c2... wait, c3 is the expected move
      // The pawn on c2 can move to c3 or c4
      getStore().handleSquareClick("c2");

      expect(getStore().selectedSquare).toBe("c2");
      expect(getStore().validMoveTargets).toContain("c3");
    });

    it("deselects when clicking the same square", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      getStore().handleSquareClick("c2");
      expect(getStore().selectedSquare).toBe("c2");

      getStore().handleSquareClick("c2");
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("does not select opponent pieces", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      // Try to select a Black piece
      getStore().handleSquareClick("c5"); // Black bishop from Bc5
      expect(getStore().selectedSquare).toBeNull();
    });

    it("does nothing when status is not playing", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      // Status is idle — clicks should be ignored
      getStore().handleSquareClick("e2");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("clears selection when clicking empty square", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      getStore().handleSquareClick("c2");
      expect(getStore().selectedSquare).toBe("c2");

      // Click empty square
      getStore().handleSquareClick("e5"); // occupied by black pawn, not player piece
      expect(getStore().selectedSquare).toBeNull();
    });
  });

  describe("attemptMove", () => {
    it("accepts correct move and advances index", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      // Expected: c3 (White's move, index 1 after opponent played Bc5)
      // Click c2, then c3
      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      // After correct move, opponent should auto-play d6
      expect(getStore().status).toBe("opponent-moving");
      vi.advanceTimersByTime(500);

      expect(getStore().currentMoveIndex).toBe(3);
      expect(getStore().status).toBe("completed");
    });

    it("rejects wrong move and increments wrongAttempts", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      // Expected c3, but play d3 instead
      getStore().handleSquareClick("d2");
      getStore().handleSquareClick("d3");

      expect(getStore().status).toBe("wrong-move");
      expect(getStore().wrongAttempts).toBe(1);

      // Move should NOT have been executed
      expect(useGameStore.getState().moveHistory).not.toContain("d3");
    });

    it("resets to playing status after wrong move delay", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      getStore().handleSquareClick("d2");
      getStore().handleSquareClick("d3");
      expect(getStore().status).toBe("wrong-move");

      vi.advanceTimersByTime(800);
      expect(getStore().status).toBe("playing");
    });

    it("shows auto-hint after 3 wrong attempts", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      // Make 3 wrong moves
      for (let i = 0; i < 3; i++) {
        // Need to wait for wrong-move status to reset
        if (i > 0) vi.advanceTimersByTime(800);
        getStore().handleSquareClick("d2");
        getStore().handleSquareClick("d3");
      }

      // After 3 wrong attempts, arrows should be set (hint)
      const arrows = useGameStore.getState().arrows;
      expect(arrows.length).toBe(1);
      expect(arrows[0].color).toBe("green");
    });

    it("marks variation as completed when last move is played", () => {
      const opening = makeOpening({
        variations: [
          {
            id: "short",
            name: "Short",
            moves: [
              { moveNumber: 3, san: "Bc5", color: "b" }, // opponent
              { moveNumber: 4, san: "c3", color: "w" },  // player
            ],
            finalFen: "test",
          },
        ],
      });

      getStore().initOpening(opening);
      getStore().startVariation("short");
      vi.advanceTimersByTime(500); // opponent plays Bc5

      // Player plays c3 (the last move)
      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      expect(getStore().status).toBe("completed");
      expect(getStore().completedVariations["short"]).toBe(true);
    });
  });

  describe("playOpponentMove", () => {
    it("plays the opponent move and advances index", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");

      // First move is Black's Bc5 (opponent for White player)
      vi.advanceTimersByTime(500);

      expect(getStore().currentMoveIndex).toBe(1);
      expect(useGameStore.getState().moveHistory).toContain("Bc5");
    });
  });

  describe("retryVariation", () => {
    it("restarts the current variation", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      // Play a correct move
      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      // Retry
      getStore().retryVariation();

      // Should be back at the beginning, with opponent auto-playing
      expect(getStore().status).toBe("opponent-moving");
      expect(getStore().currentMoveIndex).toBe(0);
    });

    it("does nothing if no active variation", () => {
      getStore().initOpening(makeOpening());
      getStore().retryVariation(); // No active variation
      expect(getStore().status).toBe("idle");
    });
  });

  describe("showHint", () => {
    it("draws a green arrow for the expected move", () => {
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      getStore().showHint();

      const arrows = useGameStore.getState().arrows;
      expect(arrows.length).toBe(1);
      expect(arrows[0].color).toBe("green");
      // The hint should point to c3 (from c2)
      expect(arrows[0].from).toBe("c2");
      expect(arrows[0].to).toBe("c3");
    });

    it("does nothing if no expected move", () => {
      getStore().showHint();
      expect(useGameStore.getState().arrows).toEqual([]);
    });
  });

  describe("cleanup", () => {
    it("resets all state", () => {
      getStore().initOpening(makeOpening());
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500);

      getStore().cleanup();

      expect(getStore().opening).toBeNull();
      expect(getStore().activeVariation).toBeNull();
      expect(getStore().status).toBe("idle");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("clears arrows and highlights on game store", () => {
      useGameStore.getState().setArrows([{ from: "e2", to: "e4", color: "green" }]);
      useGameStore.getState().setHighlights([{ square: "e4", color: "yellow" }]);

      getStore().cleanup();

      expect(useGameStore.getState().arrows).toEqual([]);
      expect(useGameStore.getState().highlights).toEqual([]);
    });
  });

  describe("progress store integration", () => {
    it("records variation completion in progressStore when player makes final move", () => {
      const opening = makeOpening({
        variations: [
          {
            id: "short",
            name: "Short",
            moves: [
              { moveNumber: 3, san: "Bc5", color: "b" }, // opponent
              { moveNumber: 4, san: "c3", color: "w" },  // player (final)
            ],
            finalFen: "test",
          },
        ],
      });

      getStore().initOpening(opening);
      getStore().startVariation("short");
      vi.advanceTimersByTime(500); // opponent plays Bc5

      // Player plays c3 (final move)
      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      expect(getStore().status).toBe("completed");

      const progress =
        useProgressStore.getState().variations["italian-game:short"];
      expect(progress).toBeDefined();
      expect(progress.openingId).toBe("italian-game");
      expect(progress.variationId).toBe("short");
      expect(progress.totalMoves).toBe(2);
      expect(progress.repetitions).toBe(1);
    });

    it("records variation completion in progressStore when opponent makes final move", () => {
      // giuoco-piano: Bc5(b), c3(w), d6(b) — last move is opponent's
      const opening = makeOpening();
      getStore().initOpening(opening);
      getStore().startVariation("giuoco-piano");
      vi.advanceTimersByTime(500); // opponent plays Bc5

      // Player plays c3
      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      // Opponent plays d6 (final move)
      vi.advanceTimersByTime(500);

      expect(getStore().status).toBe("completed");

      const progress =
        useProgressStore.getState().variations["italian-game:giuoco-piano"];
      expect(progress).toBeDefined();
      expect(progress.totalMoves).toBe(3);
      expect(progress.repetitions).toBe(1);
    });

    it("passes wrongAttempts to progressStore for quality calculation", () => {
      const opening = makeOpening({
        variations: [
          {
            id: "short",
            name: "Short",
            moves: [
              { moveNumber: 3, san: "Bc5", color: "b" },
              { moveNumber: 4, san: "c3", color: "w" },
            ],
            finalFen: "test",
          },
        ],
      });

      getStore().initOpening(opening);
      getStore().startVariation("short");
      vi.advanceTimersByTime(500); // opponent plays Bc5

      // Make 2 wrong attempts first
      getStore().handleSquareClick("d2");
      getStore().handleSquareClick("d3");
      vi.advanceTimersByTime(800);

      getStore().handleSquareClick("d2");
      getStore().handleSquareClick("d4");
      vi.advanceTimersByTime(800);

      // Now play correct move
      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      const progress =
        useProgressStore.getState().variations["italian-game:short"];
      // 2 wrong attempts → quality 3 → EF will be lower than perfect
      expect(progress).toBeDefined();
      expect(progress.easeFactor).toBeLessThan(2.6);
    });
  });

  describe("localStorage persistence", () => {
    it("saves completed variations to localStorage", () => {
      const opening = makeOpening({
        variations: [
          {
            id: "short",
            name: "Short",
            moves: [
              { moveNumber: 3, san: "Bc5", color: "b" },
              { moveNumber: 4, san: "c3", color: "w" },
            ],
            finalFen: "test",
          },
        ],
      });

      getStore().initOpening(opening);
      getStore().startVariation("short");
      vi.advanceTimersByTime(500); // opponent plays Bc5

      getStore().handleSquareClick("c2");
      getStore().handleSquareClick("c3");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "chess-coach:opening-progress:italian-game",
        JSON.stringify({ short: true })
      );
    });

    it("loads persisted completed state on initOpening", () => {
      localStorageMock["chess-coach:opening-progress:italian-game"] =
        JSON.stringify({ "giuoco-piano": true });

      getStore().initOpening(makeOpening());
      expect(getStore().completedVariations["giuoco-piano"]).toBe(true);
    });
  });
});
