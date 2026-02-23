import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { useEndgameStore } from "./endgameStore";
import { useGameStore } from "./gameStore";
import { useProgressStore } from "./progressStore";
import type { EndgameStore } from "./endgameStore";
import type { EndgamePosition } from "@/types/endgame";

function getStore(): EndgameStore {
  return useEndgameStore.getState();
}

/**
 * Build a simple endgame position for testing.
 * Uses the "opposition-1" concept: White to move, 5-move solution.
 * FEN: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1"
 * Solution: Kd6, Kd8, e6, Ke8, e7
 */
function makePosition(overrides: Partial<EndgamePosition> = {}): EndgamePosition {
  return {
    id: "opposition-1",
    name: "Direct Opposition",
    category: "pawn-endgame",
    difficulty: "beginner",
    description: "Master the concept of opposition.",
    keyTechniques: ["Opposition: kings face each other"],
    playerColor: "w",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    solution: [
      { san: "Kd6", color: "w", annotation: "Take the opposition!" },
      { san: "Kd8", color: "b" },
      { san: "e6", color: "w", annotation: "Now push the pawn forward." },
      { san: "Ke8", color: "b" },
      { san: "e7", color: "w", annotation: "The pawn advances to the 7th rank." },
    ],
    hints: [
      "Take the opposition by placing your king directly facing the enemy king.",
      "Once you have the opposition, the pawn can advance safely.",
    ],
    ...overrides,
  };
}

/**
 * Build a single-move endgame position (non-promotion, simple king move).
 * FEN: "8/5pk1/5p2/8/3K4/8/8/8 w - - 0 1"
 * Solution: Ke4 (king on d4 moves to e4)
 */
function makeSingleMovePosition(): EndgamePosition {
  return {
    id: "king-activity-1",
    name: "King Activity",
    category: "pawn-endgame",
    difficulty: "beginner",
    description: "Activate the king.",
    keyTechniques: ["Centralize the king"],
    playerColor: "w",
    fen: "8/5pk1/5p2/8/3K4/8/8/8 w - - 0 1",
    solution: [
      { san: "Ke4", color: "w", annotation: "Advance toward the center." },
    ],
    hints: ["Centralize your king!"],
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

describe("endgameStore", () => {
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

    it("starts with null position", () => {
      expect(getStore().position).toBeNull();
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

  describe("loadPosition", () => {
    it("sets position and status to solving", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      expect(getStore().position).toBe(pos);
      expect(getStore().status).toBe("solving");
    });

    it("resets gameStore to the endgame FEN", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      expect(useGameStore.getState().fen).toBe(pos.fen);
    });

    it("clears arrows and highlights on gameStore", () => {
      useGameStore.getState().setArrows([{ from: "e2", to: "e4", color: "green" }]);
      useGameStore.getState().setHighlights([{ square: "e4", color: "yellow" }]);

      getStore().loadPosition(makePosition());

      expect(useGameStore.getState().arrows).toEqual([]);
      expect(useGameStore.getState().highlights).toEqual([]);
    });

    it("sets the first solution move as expectedMove", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      expect(getStore().expectedMove).toEqual(pos.solution[0]);
    });

    it("sets playerColor from position", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      expect(getStore().playerColor).toBe("w");
    });

    it("resets wrongAttempts, hintsUsed, currentMoveIndex", () => {
      // First load and mess up state
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Simulate some state changes by loading again
      getStore().loadPosition(pos);

      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
      expect(getStore().currentMoveIndex).toBe(0);
    });

    it("auto-plays first move if it belongs to opponent", () => {
      // FEN has Black to move, first solution move is Black's Kd8
      // Player is White, so Black's move is the opponent's
      const pos = makePosition({
        fen: "4k3/8/3K4/4P3/8/8/8/8 b - - 0 1",
        solution: [
          { san: "Kd8", color: "b" },
          { san: "e6", color: "w" },
        ],
      });

      getStore().loadPosition(pos);
      expect(getStore().status).toBe("opponent-moving");

      vi.advanceTimersByTime(500);
      expect(getStore().status).toBe("solving");
      expect(getStore().currentMoveIndex).toBe(1);
    });

    it("sets status to solving immediately if first move is player's", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);
      // First move is Kd6 (White, the player) — should be solving immediately
      expect(getStore().status).toBe("solving");
    });

    it("loads completed positions from localStorage", () => {
      const completed = { "opposition-1": true };
      localStorageMock["chess-coach:endgame-progress"] = JSON.stringify(completed);

      getStore().loadPosition(makePosition());
      expect(getStore().completedPositions).toEqual(completed);
    });

    it("handles corrupted localStorage gracefully", () => {
      localStorageMock["chess-coach:endgame-progress"] = "not-valid-json";

      getStore().loadPosition(makePosition());
      expect(getStore().completedPositions).toEqual({});
    });
  });

  describe("handleSquareClick", () => {
    it("only works in solving status", () => {
      // Status is idle, clicks should be ignored
      getStore().handleSquareClick("e6");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("selects a player's piece and shows valid move targets", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);
      // First move is White's Kd6 — player's turn (solving)

      // Click the White king on e6
      getStore().handleSquareClick("e6");

      expect(getStore().selectedSquare).toBe("e6");
      expect(getStore().validMoveTargets.length).toBeGreaterThan(0);
      expect(getStore().validMoveTargets).toContain("d6");
    });

    it("deselects when clicking the same square", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6");
      expect(getStore().selectedSquare).toBe("e6");

      getStore().handleSquareClick("e6");
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("does not select opponent pieces", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Try to select the Black king on e8
      getStore().handleSquareClick("e8");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("clears selection when clicking empty square with no selection", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("a1"); // empty square
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("clears selection when clicking empty/opponent square after selecting", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6"); // select White king
      expect(getStore().selectedSquare).toBe("e6");

      // Click on a square that is NOT a valid move target and not a player piece
      getStore().handleSquareClick("a1");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("triggers attemptMove when clicking a valid move target", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Select White king on e6
      getStore().handleSquareClick("e6");
      expect(getStore().validMoveTargets).toContain("d6");

      // Click d6 — correct move (Kd6)
      getStore().handleSquareClick("d6");

      // After correct move, opponent should auto-play
      expect(getStore().currentMoveIndex).toBe(1);
    });

    it("does nothing during opponent-moving status", () => {
      const pos = makePosition({
        fen: "4k3/8/3K4/4P3/8/8/8/8 b - - 0 1",
        solution: [
          { san: "Kd8", color: "b" },
          { san: "e6", color: "w" },
        ],
      });
      getStore().loadPosition(pos);
      expect(getStore().status).toBe("opponent-moving");

      getStore().handleSquareClick("d6");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("does nothing during wrong-move status", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Make a wrong move manually
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f6"); // wrong — expected Kd6

      expect(getStore().status).toBe("wrong-move");

      // Clicking during wrong-move should be ignored
      getStore().handleSquareClick("e6");
      expect(getStore().selectedSquare).toBeNull();
    });
  });

  describe("attemptMove", () => {
    it("accepts correct move and advances currentMoveIndex", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // First expected: Kd6 (White's move, index 0)
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6"); // correct: Kd6

      // After correct move, index advances and opponent auto-plays Kd8
      expect(getStore().status).toBe("opponent-moving");

      vi.advanceTimersByTime(500);
      expect(getStore().currentMoveIndex).toBe(2);
      expect(getStore().status).toBe("solving");
    });

    it("executes the move on gameStore for correct answer", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6"); // Kd6

      expect(useGameStore.getState().moveHistory).toContain("Kd6");
    });

    it("rejects wrong move and sets wrong-move status", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Expected Kd6, but play Kf6 instead
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f6"); // wrong

      expect(getStore().status).toBe("wrong-move");
      expect(getStore().wrongAttempts).toBe(1);
    });

    it("increments wrongAttempts for each wrong answer", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // First wrong move
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f6");
      expect(getStore().wrongAttempts).toBe(1);

      // Wait for reset
      vi.advanceTimersByTime(800);
      expect(getStore().status).toBe("solving");

      // Second wrong move
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f5");
      expect(getStore().wrongAttempts).toBe(2);
    });

    it("sets red highlight on gameStore for wrong move", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f6"); // wrong

      const highlights = useGameStore.getState().highlights;
      expect(highlights).toEqual([{ square: "f6", color: "red" }]);
    });

    it("resets to solving status after wrong-move delay (800ms)", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f6");
      expect(getStore().status).toBe("wrong-move");

      vi.advanceTimersByTime(800);
      expect(getStore().status).toBe("solving");
      expect(useGameStore.getState().highlights).toEqual([]);
    });

    it("shows auto-hint after 3 wrong attempts", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Make 3 wrong moves
      for (let i = 0; i < 3; i++) {
        if (i > 0) vi.advanceTimersByTime(800);
        getStore().handleSquareClick("e6");
        getStore().handleSquareClick("f6");
      }

      // After 3 wrong attempts, a hint should have been triggered
      // First hint call shows text hint
      expect(getStore().hintText).toBe(
        "Take the opposition by placing your king directly facing the enemy king."
      );
      expect(getStore().hintsUsed).toBeGreaterThan(0);
    });

    it("sets annotation as hintText after correct move", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Play correct Kd6 (has annotation)
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");

      expect(getStore().hintText).toBe("Take the opposition!");
    });
  });

  describe("completion", () => {
    it("sets status to completed after single-move solution", () => {
      const pos = makeSingleMovePosition();
      getStore().loadPosition(pos);

      // Only move: Ke4 (king on d4 moves to e4)
      getStore().handleSquareClick("d4");
      getStore().handleSquareClick("e4");

      expect(getStore().status).toBe("completed");
      expect(getStore().expectedMove).toBeNull();
    });

    it("marks position as completed in completedPositions", () => {
      const pos = makeSingleMovePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("d4");
      getStore().handleSquareClick("e4");

      expect(getStore().completedPositions["king-activity-1"]).toBe(true);
    });

    it("saves completedPositions to localStorage on completion", () => {
      const pos = makeSingleMovePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("d4");
      getStore().handleSquareClick("e4");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "chess-coach:endgame-progress",
        expect.stringContaining("king-activity-1")
      );
    });

    it("completes after full multi-move sequence", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Move 0: Kd6 (White — player)
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");
      vi.advanceTimersByTime(500); // opponent plays Kd8

      // Move 2: e6 (White — player)
      getStore().handleSquareClick("e5");
      getStore().handleSquareClick("e6");
      vi.advanceTimersByTime(500); // opponent plays Ke8

      // Move 4: e7 (White — player, final move)
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("e7");

      expect(getStore().status).toBe("completed");
      expect(getStore().completedPositions["opposition-1"]).toBe(true);
    });

    it("completes when opponent makes the final move", () => {
      // Create a position where the last move is the opponent's
      const pos = makePosition({
        id: "ends-with-opponent",
        fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
        solution: [
          { san: "Kd6", color: "w" },
          { san: "Kd8", color: "b" }, // final move is opponent's
        ],
      });

      getStore().loadPosition(pos);

      // Play Kd6
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");

      // Opponent plays Kd8 (final)
      vi.advanceTimersByTime(500);

      expect(getStore().status).toBe("completed");
      expect(getStore().completedPositions["ends-with-opponent"]).toBe(true);
    });
  });

  describe("showHint", () => {
    it("cycles through text hints first", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().showHint();
      expect(getStore().hintText).toBe(
        "Take the opposition by placing your king directly facing the enemy king."
      );
      expect(getStore().currentHintIndex).toBe(1);
      expect(getStore().hintsUsed).toBe(1);

      getStore().showHint();
      expect(getStore().hintText).toBe(
        "Once you have the opposition, the pawn can advance safely."
      );
      expect(getStore().currentHintIndex).toBe(2);
      expect(getStore().hintsUsed).toBe(2);
    });

    it("shows arrow on expected move after all text hints exhausted", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Exhaust both text hints
      getStore().showHint(); // hint 1
      getStore().showHint(); // hint 2

      // Now show arrow
      getStore().showHint();

      const arrows = useGameStore.getState().arrows;
      expect(arrows.length).toBe(1);
      expect(arrows[0].color).toBe("green");
      // Arrow should point from e6 to d6 (Kd6)
      expect(arrows[0].from).toBe("e6");
      expect(arrows[0].to).toBe("d6");
      expect(getStore().hintsUsed).toBe(3);
    });

    it("does nothing if no position is loaded", () => {
      getStore().showHint();
      expect(getStore().hintText).toBeNull();
      expect(useGameStore.getState().arrows).toEqual([]);
    });
  });

  describe("retryPosition", () => {
    it("resets the position to the beginning", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Make a correct move
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");
      vi.advanceTimersByTime(500);

      expect(getStore().currentMoveIndex).toBe(2);

      // Retry
      getStore().retryPosition();

      expect(getStore().currentMoveIndex).toBe(0);
      expect(getStore().status).toBe("solving");
      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
    });

    it("resets gameStore back to original FEN", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Make a move
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");

      // Retry
      getStore().retryPosition();

      expect(useGameStore.getState().fen).toBe(pos.fen);
    });

    it("does nothing if no position is loaded", () => {
      getStore().retryPosition();
      expect(getStore().status).toBe("idle");
    });
  });

  describe("cleanup", () => {
    it("resets to initial state", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");

      getStore().cleanup();

      expect(getStore().position).toBeNull();
      expect(getStore().status).toBe("idle");
      expect(getStore().currentMoveIndex).toBe(0);
      expect(getStore().playerColor).toBe("w");
      expect(getStore().wrongAttempts).toBe(0);
      expect(getStore().hintsUsed).toBe(0);
      expect(getStore().currentHintIndex).toBe(0);
      expect(getStore().hintText).toBeNull();
      expect(getStore().expectedMove).toBeNull();
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });

    it("clears arrows and highlights on gameStore", () => {
      useGameStore.getState().setArrows([{ from: "e2", to: "e4", color: "green" }]);
      useGameStore.getState().setHighlights([{ square: "e4", color: "yellow" }]);

      getStore().cleanup();

      expect(useGameStore.getState().arrows).toEqual([]);
      expect(useGameStore.getState().highlights).toEqual([]);
    });
  });

  describe("playOpponentMove", () => {
    it("plays the opponent move and advances index", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Player plays Kd6 (correct)
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");

      // Now opponent should auto-play Kd8 after delay
      expect(getStore().status).toBe("opponent-moving");
      vi.advanceTimersByTime(500);

      expect(getStore().currentMoveIndex).toBe(2);
      expect(useGameStore.getState().moveHistory).toContain("Kd8");
      expect(getStore().status).toBe("solving");
    });
  });

  describe("progress store integration", () => {
    it("records endgame completion in progressStore", () => {
      const pos = makeSingleMovePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("d4");
      getStore().handleSquareClick("e4");

      const progress = useProgressStore.getState().endgameProgress["king-activity-1"];
      expect(progress).toBeDefined();
      expect(progress.completed).toBe(true);
      expect(progress.wrongAttempts).toBe(0);
      expect(progress.hintsUsed).toBe(0);
    });

    it("passes wrongAttempts and hintsUsed to progressStore", () => {
      const pos = makePosition();
      getStore().loadPosition(pos);

      // Use a hint before solving
      getStore().showHint();

      // Make a wrong move first
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("f6"); // wrong
      vi.advanceTimersByTime(800);

      // Now play all correct moves
      // Move 0: Kd6
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");
      vi.advanceTimersByTime(500); // opponent Kd8

      // Move 2: e6
      getStore().handleSquareClick("e5");
      getStore().handleSquareClick("e6");
      vi.advanceTimersByTime(500); // opponent Ke8

      // Move 4: e7 (final)
      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("e7");

      expect(getStore().status).toBe("completed");
      const progress = useProgressStore.getState().endgameProgress["opposition-1"];
      expect(progress).toBeDefined();
      expect(progress.completed).toBe(true);
      expect(progress.wrongAttempts).toBe(1);
      expect(progress.hintsUsed).toBe(1);
    });

    it("records completion when opponent makes the final move", () => {
      const pos = makePosition({
        id: "opponent-final",
        fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
        solution: [
          { san: "Kd6", color: "w" },
          { san: "Kd8", color: "b" },
        ],
      });

      getStore().loadPosition(pos);

      getStore().handleSquareClick("e6");
      getStore().handleSquareClick("d6");
      vi.advanceTimersByTime(500); // opponent plays Kd8 (final)

      const progress = useProgressStore.getState().endgameProgress["opponent-final"];
      expect(progress).toBeDefined();
      expect(progress.completed).toBe(true);
    });
  });

  describe("localStorage persistence", () => {
    it("saves completed positions to localStorage on completion", () => {
      const pos = makeSingleMovePosition();
      getStore().loadPosition(pos);

      getStore().handleSquareClick("d4");
      getStore().handleSquareClick("e4");

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        "chess-coach:endgame-progress",
        JSON.stringify({ "king-activity-1": true })
      );
    });

    it("loads persisted completed state on loadPosition", () => {
      localStorageMock["chess-coach:endgame-progress"] = JSON.stringify({
        "opposition-1": true,
      });

      getStore().loadPosition(makePosition());
      expect(getStore().completedPositions["opposition-1"]).toBe(true);
    });

    it("starts with empty completedPositions if nothing saved", () => {
      getStore().loadPosition(makePosition());
      expect(getStore().completedPositions).toEqual({});
    });
  });
});
