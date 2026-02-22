import { describe, it, expect, beforeEach } from "vitest";
import { useGameStore } from "./gameStore";
import type { GameStore } from "./gameStore";

// Helper to get store state/actions directly
function getStore(): GameStore {
  return useGameStore.getState();
}

describe("gameStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    getStore().reset();
  });

  describe("initial state", () => {
    it("starts with the standard chess position", () => {
      const state = getStore();
      expect(state.fen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
    });

    it("starts with no selection", () => {
      const state = getStore();
      expect(state.selectedSquare).toBeNull();
      expect(state.validMoveTargets).toEqual([]);
    });

    it("starts with empty move history", () => {
      expect(getStore().moveHistory).toEqual([]);
    });

    it("starts with board not flipped", () => {
      expect(getStore().flipped).toBe(false);
    });

    it("starts with no arrows or highlights", () => {
      const state = getStore();
      expect(state.arrows).toEqual([]);
      expect(state.highlights).toEqual([]);
    });

    it("starts with white to move", () => {
      expect(getStore().status.turn).toBe("w");
    });

    it("starts with no last move", () => {
      expect(getStore().lastMove).toBeNull();
    });
  });

  describe("selectSquare", () => {
    it("selects a piece and shows valid moves", () => {
      getStore().selectSquare("e2");
      const state = getStore();
      expect(state.selectedSquare).toBe("e2");
      expect(state.validMoveTargets).toContain("e3");
      expect(state.validMoveTargets).toContain("e4");
    });

    it("deselects when clicking the same square", () => {
      getStore().selectSquare("e2");
      getStore().selectSquare("e2");
      const state = getStore();
      expect(state.selectedSquare).toBeNull();
      expect(state.validMoveTargets).toEqual([]);
    });

    it("clears selection when clicking empty square with no selection", () => {
      getStore().selectSquare("e4");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("makes a move when clicking a valid target", () => {
      getStore().selectSquare("e2"); // Select white pawn
      getStore().selectSquare("e4"); // Click valid move target

      const state = getStore();
      expect(state.selectedSquare).toBeNull();
      expect(state.validMoveTargets).toEqual([]);
      expect(state.moveHistory).toEqual(["e4"]);
      expect(state.lastMove).toEqual({ from: "e2", to: "e4" });
      expect(state.status.turn).toBe("b");
    });

    it("switches selection when clicking a different own piece", () => {
      getStore().selectSquare("e2"); // Select e2 pawn
      getStore().selectSquare("d2"); // Select d2 pawn instead

      const state = getStore();
      expect(state.selectedSquare).toBe("d2");
      expect(state.validMoveTargets).toContain("d3");
      expect(state.validMoveTargets).toContain("d4");
    });

    it("does not select opponent pieces", () => {
      // White to move, clicking black pawn
      getStore().selectSquare("e7");
      expect(getStore().selectedSquare).toBeNull();
    });

    it("does not allow selection when game is over", () => {
      // Set up a checkmate position: fool's mate
      getStore().move({ from: "f2", to: "f3" });
      getStore().move({ from: "e7", to: "e5" });
      getStore().move({ from: "g2", to: "g4" });
      getStore().move({ from: "d8", to: "h4" }); // Checkmate!

      expect(getStore().status.isCheckmate).toBe(true);
      getStore().selectSquare("e2");
      expect(getStore().selectedSquare).toBeNull();
    });
  });

  describe("move", () => {
    it("makes a valid move and updates state", () => {
      const success = getStore().move({ from: "e2", to: "e4" });
      expect(success).toBe(true);

      const state = getStore();
      expect(state.moveHistory).toEqual(["e4"]);
      expect(state.status.turn).toBe("b");
      expect(state.lastMove).toEqual({ from: "e2", to: "e4" });
    });

    it("rejects invalid moves", () => {
      const success = getStore().move({ from: "e2", to: "e5" });
      expect(success).toBe(false);
      expect(getStore().moveHistory).toEqual([]);
    });

    it("clears selection after a move", () => {
      getStore().selectSquare("e2");
      getStore().move({ from: "e2", to: "e4" });

      const state = getStore();
      expect(state.selectedSquare).toBeNull();
      expect(state.validMoveTargets).toEqual([]);
    });

    it("clears arrows and highlights after a move", () => {
      getStore().setArrows([{ from: "e2", to: "e4", color: "green" }]);
      getStore().setHighlights([{ square: "e4", color: "yellow" }]);
      getStore().move({ from: "e2", to: "e4" });

      expect(getStore().arrows).toEqual([]);
      expect(getStore().highlights).toEqual([]);
    });

    it("detects check", () => {
      // Scholar's mate setup
      getStore().move({ from: "e2", to: "e4" });
      getStore().move({ from: "e7", to: "e5" });
      getStore().move({ from: "d1", to: "h5" });
      getStore().move({ from: "b8", to: "c6" });
      getStore().move({ from: "f1", to: "c4" });
      getStore().move({ from: "g8", to: "f6" });
      getStore().move({ from: "h5", to: "f7" }); // Checkmate!

      expect(getStore().status.isCheckmate).toBe(true);
      expect(getStore().status.isGameOver).toBe(true);
    });
  });

  describe("reset", () => {
    it("resets to starting position", () => {
      getStore().move({ from: "e2", to: "e4" });
      getStore().move({ from: "e7", to: "e5" });
      getStore().reset();

      const state = getStore();
      expect(state.fen).toBe(
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
      );
      expect(state.moveHistory).toEqual([]);
      expect(state.lastMove).toBeNull();
      expect(state.selectedSquare).toBeNull();
    });

    it("resets to a custom FEN", () => {
      const customFen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
      getStore().reset(customFen);

      expect(getStore().fen).toBe(customFen);
    });
  });

  describe("flipBoard", () => {
    it("toggles the flipped state", () => {
      expect(getStore().flipped).toBe(false);
      getStore().flipBoard();
      expect(getStore().flipped).toBe(true);
      getStore().flipBoard();
      expect(getStore().flipped).toBe(false);
    });
  });

  describe("setArrows / setHighlights", () => {
    it("sets arrows on the board", () => {
      const arrows = [
        { from: "e2", to: "e4", color: "green" as const },
        { from: "d7", to: "d5", color: "red" as const },
      ];
      getStore().setArrows(arrows);
      expect(getStore().arrows).toEqual(arrows);
    });

    it("sets highlights on the board", () => {
      const highlights = [
        { square: "e4", color: "yellow" as const },
        { square: "d5", color: "blue" as const },
      ];
      getStore().setHighlights(highlights);
      expect(getStore().highlights).toEqual(highlights);
    });
  });

  describe("clearSelection", () => {
    it("clears the current selection", () => {
      getStore().selectSquare("e2");
      expect(getStore().selectedSquare).toBe("e2");

      getStore().clearSelection();
      expect(getStore().selectedSquare).toBeNull();
      expect(getStore().validMoveTargets).toEqual([]);
    });
  });
});
