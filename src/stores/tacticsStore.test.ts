import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useTacticsStore } from "./tacticsStore";
import { useGameStore } from "./gameStore";
import { useProgressStore } from "./progressStore";
import type { TacticsStore } from "./tacticsStore";
import type { TacticsPuzzle } from "@/types/tactics";

function getStore(): TacticsStore {
  return useTacticsStore.getState();
}

/**
 * Simple two-move puzzle: White plays Re8# (back rank mate).
 * Single player move, no opponent response.
 */
function makeSimplePuzzle(overrides: Partial<TacticsPuzzle> = {}): TacticsPuzzle {
  return {
    id: "back-rank-1",
    name: "Back Rank Mate",
    theme: "back-rank",
    difficulty: "beginner",
    description: "White to move and deliver checkmate on the back rank.",
    playerColor: "w",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: [
      {
        san: "Re8#",
        color: "w",
        annotation: "The rook slides to the 8th rank — checkmate!",
      },
    ],
    hints: [
      "Look at Black's back rank — is the king trapped?",
      "The pawns block the king from escaping.",
    ],
    ...overrides,
  };
}

/**
 * Multi-move puzzle: White skewers the rook.
 * Re8+ (White), Kf7 (Black), Rxa8 (White).
 */
function makeMultiMovePuzzle(): TacticsPuzzle {
  return {
    id: "skewer-1",
    name: "Rook Skewer",
    theme: "skewer",
    difficulty: "intermediate",
    description: "White can skewer the king to win the rook.",
    playerColor: "w",
    fen: "r4k2/8/8/8/8/8/8/4R1K1 w - - 0 1",
    solution: [
      {
        san: "Re8+",
        color: "w",
        annotation: "Check! The king and rook are aligned.",
      },
      {
        san: "Kf7",
        color: "b",
        annotation: "The king steps away from the rook.",
      },
      {
        san: "Rxa8",
        color: "w",
        annotation: "The rook captures the now-unprotected rook on a8!",
      },
    ],
    hints: [
      "A skewer attacks a valuable piece, forcing it to move.",
      "Can you give check along the 8th rank?",
    ],
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

describe("tacticsStore", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getStore().cleanup();
    useGameStore.getState().reset();
    // Reset progress store
    useProgressStore.setState({
      variations: {},
      tacticsProgress: {},
      endgameProgress: {},
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

    it("starts with null puzzle", () => {
      expect(getStore().puzzle).toBeNull();
    });

    it("starts with no selection", () => {
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("starts with zero wrongAttempts and hintsUsed", () => {
      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
    });

    it("starts with null expectedMove and hintText", () => {
      expect(getStore().expectedMove).toBeNull();
      expect(getStore().hintText).toBeNull();
    });
  });

  describe("loadPuzzle", () => {
    it("sets puzzle and status to solving", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      expect(getStore().puzzle).toBe(puzzle);
      expect(getStore().status).toBe("solving");
    });

    it("resets gameStore to puzzle FEN", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      expect(useGameStore.getState().fen).toBe(puzzle.fen);
    });

    it("sets playerColor from puzzle", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      expect(getStore().playerColor).toBe("w");
    });

    it("sets expectedMove to the first solution move", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      expect(getStore().expectedMove).toEqual(puzzle.solution[0]);
    });

    it("resets wrongAttempts and hintsUsed", () => {
      // First load and accumulate some state
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);
      // Manually set some state to simulate usage
      useTacticsStore.setState({ wrongAttempts: 5, hintsUsed: 3 });

      // Reload
      getStore().loadPuzzle(puzzle);
      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
    });

    it("clears arrows and highlights on gameStore", () => {
      useGameStore.getState().setArrows([{ from: "e2", to: "e4", color: "green" }]);
      useGameStore.getState().setHighlights([{ square: "e4", color: "yellow" }]);

      getStore().loadPuzzle(makeSimplePuzzle());

      expect(useGameStore.getState().arrows).toEqual([]);
      expect(useGameStore.getState().highlights).toEqual([]);
    });

    it("loads solved puzzles from localStorage", () => {
      const solved = { "back-rank-1": true };
      localStorageMock["chess-coach:tactics-progress"] = JSON.stringify(solved);

      getStore().loadPuzzle(makeSimplePuzzle());
      expect(getStore().solvedPuzzles).toEqual(solved);
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorageMock["chess-coach:tactics-progress"] = "not-valid-json";

      getStore().loadPuzzle(makeSimplePuzzle());
      expect(getStore().solvedPuzzles).toEqual({});
    });

    it("auto-plays first move if it belongs to opponent", () => {
      // Puzzle where first move is Black's (opponent for White player)
      const puzzle = makeSimplePuzzle({
        playerColor: "w",
        fen: "r4k2/8/8/8/8/8/8/4R1K1 w - - 0 1",
        solution: [
          { san: "Re8+", color: "b" }, // "opponent" move first (unusual but tests the branch)
        ],
      });

      // We need a puzzle where the first move color does NOT match playerColor
      // But the FEN must allow that move. This is conceptually testing the branch.
      // The multi-move puzzle is player-first, so let's create a custom one.
      const blackPlayerPuzzle: TacticsPuzzle = {
        id: "test-opponent-first",
        name: "Test",
        theme: "fork",
        difficulty: "beginner",
        description: "Test",
        playerColor: "b",
        fen: "r4k2/8/8/8/8/8/8/4R1K1 w - - 0 1",
        solution: [
          { san: "Re8+", color: "w" }, // opponent move (White plays first, student is Black)
          { san: "Kf7", color: "b" },  // student's move
        ],
        hints: ["Test hint"],
      };

      getStore().loadPuzzle(blackPlayerPuzzle);

      // Before timer: status should be opponent-moving
      expect(getStore().status).toBe("opponent-moving");

      // After timer fires, opponent move is played
      vi.advanceTimersByTime(500);

      expect(getStore().status).toBe("solving");
      expect(getStore().currentMoveIndex).toBe(1);
      expect(useGameStore.getState().moveHistory).toContain("Re8+");
    });
  });

  describe("handleSquareClick", () => {
    it("does nothing when status is not solving", () => {
      // Status is idle
      getStore().handleSquareClick("e2");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("selects a player's piece and shows valid move targets", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      // White's rook on e1
      getStore().handleSquareClick("e1");

      expect(getStore().selectedSquare).toBe("e1");
      expect(getStore().validMoveTargets.length).toBeGreaterThan(0);
    });

    it("deselects when clicking the same square", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().handleSquareClick("e1");
      expect(getStore().selectedSquare).toBe("e1");

      getStore().handleSquareClick("e1");
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("does not select opponent pieces", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      // Try to select Black's pawn (f7, g7, h7 are Black pawns)
      getStore().handleSquareClick("f7");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("clears selection when clicking empty square", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().handleSquareClick("e1");
      expect(getStore().selectedSquare).toBe("e1");

      // Click an empty square
      getStore().handleSquareClick("a5");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("attempts move when clicking a valid target square", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      // Select rook on e1, then click e8 (the correct move Re8#)
      getStore().handleSquareClick("e1");
      expect(getStore().validMoveTargets).toContain("e8");

      getStore().handleSquareClick("e8");

      // Puzzle has only one move — should be solved
      expect(getStore().status).toBe("solved");
    });

    it("does nothing when status is wrong-move", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Make a wrong move manually
      useTacticsStore.setState({ status: "wrong-move" });

      getStore().handleSquareClick("e1");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("does nothing when status is opponent-moving", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      useTacticsStore.setState({ status: "opponent-moving" });

      getStore().handleSquareClick("e1");
      expect(getStore().selectedSquare).toBeNull();
    });
  });

  describe("attemptMove", () => {
    it("executes correct move and advances currentMoveIndex", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Expected: Re8+ (player's move)
      getStore().attemptMove("Re8+", "e1", "e8");

      // After correct move, opponent should auto-play Kf7
      expect(getStore().status).toBe("opponent-moving");
      expect(getStore().currentMoveIndex).toBe(1);
    });

    it("rejects wrong move and sets wrong-move status", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Expected Re8+, but try Re2 instead
      getStore().attemptMove("Re2", "e1", "e2");

      expect(getStore().status).toBe("wrong-move");
      expect(getStore().wrongAttempts).toBe(1);
    });

    it("increments wrongAttempts on each wrong move", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re2", "e1", "e2");
      expect(getStore().wrongAttempts).toBe(1);

      vi.advanceTimersByTime(800); // wait for reset to solving
      getStore().attemptMove("Re3", "e1", "e3");
      expect(getStore().wrongAttempts).toBe(2);
    });

    it("resets to solving after wrong move delay", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re2", "e1", "e2");
      expect(getStore().status).toBe("wrong-move");

      vi.advanceTimersByTime(800);
      expect(getStore().status).toBe("solving");
    });

    it("sets red highlight on wrong move target square", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re2", "e1", "e2");

      const highlights = useGameStore.getState().highlights;
      expect(highlights).toEqual([{ square: "e2", color: "red" }]);
    });

    it("clears red highlight after wrong move delay", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re2", "e1", "e2");
      vi.advanceTimersByTime(800);

      expect(useGameStore.getState().highlights).toEqual([]);
    });

    it("clears selection after correct move", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re8+", "e1", "e8");

      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("clears selection after wrong move", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re2", "e1", "e2");

      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("shows annotation as hintText after correct move", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re8+", "e1", "e8");

      expect(getStore().hintText).toBe(
        "Check! The king and rook are aligned."
      );
    });

    it("does nothing if no puzzle is loaded", () => {
      getStore().attemptMove("Re8+", "e1", "e8");
      // Should not throw, just silently return
      expect(getStore().status).toBe("idle");
    });
  });

  describe("multi-move puzzle completion", () => {
    it("status becomes solved after all solution moves", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Move 1: Re8+ (player)
      getStore().attemptMove("Re8+", "e1", "e8");
      expect(getStore().status).toBe("opponent-moving");

      // Move 2: Kf7 (opponent, auto-played)
      vi.advanceTimersByTime(500);
      expect(getStore().currentMoveIndex).toBe(2);
      expect(getStore().status).toBe("solving");

      // Move 3: Rxa8 (player)
      getStore().attemptMove("Rxa8", "e8", "a8");
      expect(getStore().status).toBe("solved");
      expect(getStore().currentMoveIndex).toBe(3);
    });

    it("marks puzzle as solved in solvedPuzzles", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re8+", "e1", "e8");
      vi.advanceTimersByTime(500); // opponent plays Kf7
      getStore().attemptMove("Rxa8", "e8", "a8");

      expect(getStore().solvedPuzzles["skewer-1"]).toBe(true);
    });

    it("persists solved puzzles to localStorage", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re8+", "e1", "e8");
      vi.advanceTimersByTime(500);
      getStore().attemptMove("Rxa8", "e8", "a8");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "chess-coach:tactics-progress",
        JSON.stringify({ "skewer-1": true })
      );
    });

    it("single-move puzzle completes immediately", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      // Select rook and move to e8
      getStore().handleSquareClick("e1");
      getStore().handleSquareClick("e8");

      expect(getStore().status).toBe("solved");
      expect(getStore().solvedPuzzles["back-rank-1"]).toBe(true);
    });
  });

  describe("playOpponentMove", () => {
    it("executes opponent move and advances to next player move", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Player plays Re8+
      getStore().attemptMove("Re8+", "e1", "e8");
      expect(getStore().status).toBe("opponent-moving");

      // Opponent plays Kf7
      vi.advanceTimersByTime(500);

      expect(getStore().currentMoveIndex).toBe(2);
      expect(getStore().status).toBe("solving");
      expect(useGameStore.getState().moveHistory).toContain("Kf7");
    });
  });

  describe("showHint", () => {
    it("cycles through text hints first", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      // First hint
      getStore().showHint();
      expect(getStore().hintText).toBe(
        "Look at Black's back rank — is the king trapped?"
      );
      expect(getStore().hintsUsed).toBe(1);
      expect(getStore().currentHintIndex).toBe(1);

      // Second hint
      getStore().showHint();
      expect(getStore().hintText).toBe(
        "The pawns block the king from escaping."
      );
      expect(getStore().hintsUsed).toBe(2);
      expect(getStore().currentHintIndex).toBe(2);
    });

    it("shows arrow on expected move after all text hints exhausted", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      // Exhaust all 2 text hints
      getStore().showHint();
      getStore().showHint();

      // Third call should show arrow
      getStore().showHint();

      const arrows = useGameStore.getState().arrows;
      expect(arrows.length).toBe(1);
      expect(arrows[0].color).toBe("green");
      expect(arrows[0].from).toBe("e1");
      expect(arrows[0].to).toBe("e8");
      expect(getStore().hintsUsed).toBe(3);
    });

    it("does nothing if no puzzle is loaded", () => {
      getStore().showHint();
      expect(getStore().hintText).toBeNull();
      expect(useGameStore.getState().arrows).toEqual([]);
    });
  });

  describe("auto-hint after 3 wrong attempts", () => {
    it("triggers showHint automatically after threshold", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Make 3 wrong moves
      for (let i = 0; i < 3; i++) {
        if (i > 0) vi.advanceTimersByTime(800); // wait for wrong-move reset
        getStore().attemptMove("Re2", "e1", "e2");
      }

      // After 3 wrong attempts, first text hint should appear
      expect(getStore().hintText).toBe(
        "A skewer attacks a valuable piece, forcing it to move."
      );
      expect(getStore().hintsUsed).toBe(1);
    });
  });

  describe("retryPuzzle", () => {
    it("resets the puzzle to its initial state", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Play a correct move
      getStore().attemptMove("Re8+", "e1", "e8");
      vi.advanceTimersByTime(500);

      // Retry
      getStore().retryPuzzle();

      expect(getStore().status).toBe("solving");
      expect(getStore().currentMoveIndex).toBe(0);
      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
      expect(getStore().selectedSquare).toBeNull();
      expect(useGameStore.getState().fen).toBe(puzzle.fen);
    });

    it("does nothing if no puzzle is loaded", () => {
      getStore().retryPuzzle();
      expect(getStore().status).toBe("idle");
    });

    it("keeps the same puzzle after retry", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().retryPuzzle();
      expect(getStore().puzzle?.id).toBe("skewer-1");
    });
  });

  describe("cleanup", () => {
    it("resets all state to initial values", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().attemptMove("Re8+", "e1", "e8");
      vi.advanceTimersByTime(500);

      getStore().cleanup();

      expect(getStore().puzzle).toBeNull();
      expect(getStore().status).toBe("idle");
      expect(getStore().currentMoveIndex).toBe(0);
      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
      expect(getStore().expectedMove).toBeNull();
      expect(getStore().hintText).toBeNull();
    });

    it("clears arrows and highlights on gameStore", () => {
      useGameStore.getState().setArrows([{ from: "e2", to: "e4", color: "green" }]);
      useGameStore.getState().setHighlights([{ square: "e4", color: "yellow" }]);

      getStore().cleanup();

      expect(useGameStore.getState().arrows).toEqual([]);
      expect(useGameStore.getState().highlights).toEqual([]);
    });
  });

  describe("progress store integration", () => {
    it("records puzzle completion in progressStore", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().handleSquareClick("e1");
      getStore().handleSquareClick("e8");

      expect(getStore().status).toBe("solved");

      const progress = useProgressStore.getState().tacticsProgress["back-rank-1"];
      expect(progress).toBeDefined();
      expect(progress.puzzleId).toBe("back-rank-1");
      expect(progress.solved).toBe(true);
      expect(progress.attempts).toBe(1);
    });

    it("passes wrongAttempts and hintsUsed to progressStore", () => {
      const puzzle = makeMultiMovePuzzle();
      getStore().loadPuzzle(puzzle);

      // Make 2 wrong attempts
      getStore().attemptMove("Re2", "e1", "e2");
      vi.advanceTimersByTime(800);
      getStore().attemptMove("Re3", "e1", "e3");
      vi.advanceTimersByTime(800);

      // Use a hint
      getStore().showHint();

      // Now solve it
      getStore().attemptMove("Re8+", "e1", "e8");
      vi.advanceTimersByTime(500); // opponent Kf7
      getStore().attemptMove("Rxa8", "e8", "a8");

      expect(getStore().status).toBe("solved");

      const progress = useProgressStore.getState().tacticsProgress["skewer-1"];
      expect(progress).toBeDefined();
      expect(progress.solved).toBe(true);
      expect(progress.hintsUsed).toBe(1);
    });
  });

  describe("localStorage persistence", () => {
    it("saves solved puzzles to localStorage on completion", () => {
      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().handleSquareClick("e1");
      getStore().handleSquareClick("e8");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "chess-coach:tactics-progress",
        JSON.stringify({ "back-rank-1": true })
      );
    });

    it("loads persisted solved state on loadPuzzle", () => {
      localStorageMock["chess-coach:tactics-progress"] = JSON.stringify({
        "other-puzzle": true,
      });

      getStore().loadPuzzle(makeSimplePuzzle());
      expect(getStore().solvedPuzzles["other-puzzle"]).toBe(true);
    });

    it("merges new solved puzzle with existing solved puzzles", () => {
      localStorageMock["chess-coach:tactics-progress"] = JSON.stringify({
        "other-puzzle": true,
      });

      const puzzle = makeSimplePuzzle();
      getStore().loadPuzzle(puzzle);

      getStore().handleSquareClick("e1");
      getStore().handleSquareClick("e8");

      expect(getStore().solvedPuzzles["other-puzzle"]).toBe(true);
      expect(getStore().solvedPuzzles["back-rank-1"]).toBe(true);
    });
  });
});
