import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCustomTrainerStore } from "./customTrainerStore";
import { useGameStore } from "./gameStore";
import { useCoachStore } from "./coachStore";
import { START_BOARD_MAP } from "@/lib/chess/fen";
import type { Piece } from "@/types/chess";

function resetStore() {
  useCustomTrainerStore.getState().cleanup();
}

describe("customTrainerStore", () => {
  beforeEach(() => {
    resetStore();
    useGameStore.getState().reset();
    useCoachStore.getState().clearChat();
  });

  describe("initial state", () => {
    it("starts in setup mode", () => {
      expect(useCustomTrainerStore.getState().mode).toBe("setup");
    });

    it("starts with starting position board map", () => {
      expect(useCustomTrainerStore.getState().boardMap.size).toBe(32);
    });

    it("starts with white pawn selected", () => {
      const piece = useCustomTrainerStore.getState().selectedPiece;
      expect(piece).toEqual({ type: "p", color: "w" });
    });

    it("starts with white to move", () => {
      expect(useCustomTrainerStore.getState().turn).toBe("w");
    });

    it("starts with no validation error", () => {
      expect(useCustomTrainerStore.getState().validationError).toBeNull();
    });
  });

  describe("selectPiece", () => {
    it("selects a piece", () => {
      useCustomTrainerStore.getState().selectPiece({ type: "q", color: "b" });
      expect(useCustomTrainerStore.getState().selectedPiece).toEqual({
        type: "q",
        color: "b",
      });
    });

    it("selects null for eraser mode", () => {
      useCustomTrainerStore.getState().selectPiece(null);
      expect(useCustomTrainerStore.getState().selectedPiece).toBeNull();
    });
  });

  describe("placePiece", () => {
    it("places selected piece on an empty square", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "w" });
      useCustomTrainerStore.getState().placePiece("e1");
      expect(useCustomTrainerStore.getState().boardMap.get("e1")).toEqual({
        type: "k",
        color: "w",
      });
    });

    it("replaces existing piece on a square", () => {
      useCustomTrainerStore.getState().selectPiece({ type: "q", color: "b" });
      useCustomTrainerStore.getState().placePiece("e1"); // Was white king
      expect(useCustomTrainerStore.getState().boardMap.get("e1")).toEqual({
        type: "q",
        color: "b",
      });
    });

    it("removes piece in eraser mode", () => {
      useCustomTrainerStore.getState().selectPiece(null);
      useCustomTrainerStore.getState().placePiece("e1");
      expect(useCustomTrainerStore.getState().boardMap.get("e1")).toBeUndefined();
    });

    it("updates validation error when placing", () => {
      // Clear board (no kings → error)
      useCustomTrainerStore.getState().clearBoard();
      expect(useCustomTrainerStore.getState().validationError).toBeTruthy();

      // Place white king
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "w" });
      useCustomTrainerStore.getState().placePiece("e1");
      expect(useCustomTrainerStore.getState().validationError).toContain("Black king");

      // Place black king → valid
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "b" });
      useCustomTrainerStore.getState().placePiece("e8");
      expect(useCustomTrainerStore.getState().validationError).toBeNull();
    });
  });

  describe("setTurn", () => {
    it("sets turn to black", () => {
      useCustomTrainerStore.getState().setTurn("b");
      expect(useCustomTrainerStore.getState().turn).toBe("b");
    });

    it("sets turn to white", () => {
      useCustomTrainerStore.getState().setTurn("b");
      useCustomTrainerStore.getState().setTurn("w");
      expect(useCustomTrainerStore.getState().turn).toBe("w");
    });
  });

  describe("clearBoard", () => {
    it("removes all pieces", () => {
      useCustomTrainerStore.getState().clearBoard();
      expect(useCustomTrainerStore.getState().boardMap.size).toBe(0);
    });

    it("sets validation error (no kings)", () => {
      useCustomTrainerStore.getState().clearBoard();
      expect(useCustomTrainerStore.getState().validationError).toContain("king");
    });
  });

  describe("resetToStart", () => {
    it("restores 32 pieces", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().resetToStart();
      expect(useCustomTrainerStore.getState().boardMap.size).toBe(32);
    });

    it("clears validation error", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().resetToStart();
      expect(useCustomTrainerStore.getState().validationError).toBeNull();
    });
  });

  describe("loadFromFen", () => {
    it("loads a valid FEN", () => {
      useCustomTrainerStore.getState().loadFromFen(
        "4k3/8/8/8/8/8/8/4K3 b - - 0 1"
      );
      const { boardMap, turn, validationError } = useCustomTrainerStore.getState();
      expect(boardMap.size).toBe(2);
      expect(turn).toBe("b");
      expect(validationError).toBeNull();
    });

    it("sets validation error for invalid position", () => {
      useCustomTrainerStore.getState().loadFromFen("8/8/8/8/8/8/8/8 w - - 0 1");
      expect(useCustomTrainerStore.getState().validationError).toBeTruthy();
    });

    it("extracts turn from FEN", () => {
      useCustomTrainerStore.getState().loadFromFen(
        "4k3/8/8/8/8/8/8/4K3 b - - 0 1"
      );
      expect(useCustomTrainerStore.getState().turn).toBe("b");
    });

    it("defaults to white when turn is missing", () => {
      useCustomTrainerStore.getState().loadFromFen("4k3/8/8/8/8/8/8/4K3");
      expect(useCustomTrainerStore.getState().turn).toBe("w");
    });
  });

  describe("startTraining", () => {
    it("returns true for valid position", () => {
      // Starting position is valid
      const result = useCustomTrainerStore.getState().startTraining();
      expect(result).toBe(true);
    });

    it("switches to play mode on success", () => {
      useCustomTrainerStore.getState().startTraining();
      expect(useCustomTrainerStore.getState().mode).toBe("play");
    });

    it("resets game store with custom FEN", () => {
      // Set up a simple position
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "w" });
      useCustomTrainerStore.getState().placePiece("e1");
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "b" });
      useCustomTrainerStore.getState().placePiece("e8");
      useCustomTrainerStore.getState().startTraining();

      const gameFen = useGameStore.getState().fen;
      expect(gameFen).toContain("4k3");
      expect(gameFen).toContain("4K3");
    });

    it("returns false for invalid position", () => {
      useCustomTrainerStore.getState().clearBoard();
      const result = useCustomTrainerStore.getState().startTraining();
      expect(result).toBe(false);
    });

    it("stays in setup mode on failure", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().startTraining();
      expect(useCustomTrainerStore.getState().mode).toBe("setup");
    });

    it("sets validation error on failure", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().startTraining();
      expect(useCustomTrainerStore.getState().validationError).toBeTruthy();
    });

    it("clears coach chat on success", () => {
      // Add a message to coachStore
      vi.spyOn(useCoachStore.getState(), "clearChat");
      useCustomTrainerStore.getState().startTraining();
      // Coach store should have been cleared (mode set to free-play)
      expect(useCoachStore.getState().mode).toBe("free-play");
    });

    it("respects turn setting", () => {
      useCustomTrainerStore.getState().setTurn("b");
      useCustomTrainerStore.getState().startTraining();
      const gameFen = useGameStore.getState().fen;
      expect(gameFen).toContain(" b ");
    });
  });

  describe("backToSetup", () => {
    it("switches back to setup mode", () => {
      useCustomTrainerStore.getState().startTraining();
      useCustomTrainerStore.getState().backToSetup();
      expect(useCustomTrainerStore.getState().mode).toBe("setup");
    });

    it("preserves board map", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "w" });
      useCustomTrainerStore.getState().placePiece("e1");
      useCustomTrainerStore.getState().selectPiece({ type: "k", color: "b" });
      useCustomTrainerStore.getState().placePiece("e8");
      useCustomTrainerStore.getState().startTraining();
      useCustomTrainerStore.getState().backToSetup();
      expect(useCustomTrainerStore.getState().boardMap.size).toBe(2);
    });
  });

  describe("cleanup", () => {
    it("resets to initial state", () => {
      useCustomTrainerStore.getState().clearBoard();
      useCustomTrainerStore.getState().setTurn("b");
      useCustomTrainerStore.getState().selectPiece({ type: "q", color: "b" });
      useCustomTrainerStore.getState().cleanup();

      const state = useCustomTrainerStore.getState();
      expect(state.mode).toBe("setup");
      expect(state.boardMap.size).toBe(32);
      expect(state.selectedPiece).toEqual({ type: "p", color: "w" });
      expect(state.turn).toBe("w");
      expect(state.validationError).toBeNull();
    });
  });

  describe("board map isolation", () => {
    it("modifying board map does not affect START_BOARD_MAP", () => {
      useCustomTrainerStore.getState().selectPiece(null);
      useCustomTrainerStore.getState().placePiece("e1");
      // START_BOARD_MAP should still have 32 pieces
      expect(START_BOARD_MAP.size).toBe(32);
      expect(START_BOARD_MAP.get("e1")).toEqual({ type: "k", color: "w" });
    });
  });
});
