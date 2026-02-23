import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  ENDGAME_POSITIONS,
  getEndgameById,
  getEndgamesByCategory,
  getEndgamesByDifficulty,
  getEndgameCategories,
} from "@/lib/data/endgames";
import { validateFEN } from "@/lib/chess/engine";
import type { EndgameCategory, EndgameDifficulty } from "@/types/endgame";

describe("ENDGAME_POSITIONS catalog", () => {
  it("has exactly 12 positions", () => {
    expect(ENDGAME_POSITIONS.length).toBe(12);
  });

  it("has unique IDs across all positions", () => {
    const ids = ENDGAME_POSITIONS.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty required fields on every position", () => {
    for (const pos of ENDGAME_POSITIONS) {
      expect(pos.id, `${pos.name} missing id`).toBeTruthy();
      expect(pos.name, `${pos.id} missing name`).toBeTruthy();
      expect(pos.category, `${pos.id} missing category`).toBeTruthy();
      expect(pos.difficulty, `${pos.id} missing difficulty`).toBeTruthy();
      expect(pos.description, `${pos.id} missing description`).toBeTruthy();
      expect(
        pos.keyTechniques,
        `${pos.id} missing keyTechniques`
      ).toBeDefined();
      expect(pos.playerColor, `${pos.id} missing playerColor`).toBeTruthy();
      expect(pos.fen, `${pos.id} missing fen`).toBeTruthy();
      expect(pos.solution, `${pos.id} missing solution`).toBeDefined();
      expect(pos.hints, `${pos.id} missing hints`).toBeDefined();
    }
  });

  it("has at least 1 keyTechnique for every position", () => {
    for (const pos of ENDGAME_POSITIONS) {
      expect(
        pos.keyTechniques.length,
        `${pos.id} should have at least 1 keyTechnique`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("has at least 1 hint for every position", () => {
    for (const pos of ENDGAME_POSITIONS) {
      expect(
        pos.hints.length,
        `${pos.id} should have at least 1 hint`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("has playerColor as 'w' or 'b' for every position", () => {
    for (const pos of ENDGAME_POSITIONS) {
      expect(
        ["w", "b"],
        `${pos.id} playerColor should be 'w' or 'b'`
      ).toContain(pos.playerColor);
    }
  });

  it("uses valid difficulty levels on every position", () => {
    const validDifficulties: EndgameDifficulty[] = [
      "beginner",
      "intermediate",
      "advanced",
    ];
    for (const pos of ENDGAME_POSITIONS) {
      expect(validDifficulties).toContain(pos.difficulty);
    }
  });

  it("uses valid categories on every position", () => {
    const validCategories: EndgameCategory[] = [
      "king-pawn",
      "king-rook",
      "king-queen",
      "king-bishop",
      "king-knight",
      "rook-endgame",
      "pawn-endgame",
      "queen-endgame",
    ];
    for (const pos of ENDGAME_POSITIONS) {
      expect(validCategories).toContain(pos.category);
    }
  });
});

describe("FEN validity", () => {
  it("has a valid FEN on every position", () => {
    for (const pos of ENDGAME_POSITIONS) {
      const result = validateFEN(pos.fen);
      expect(result.ok, `${pos.id} has invalid FEN: ${result.error}`).toBe(
        true
      );
    }
  });
});

describe("Solution move integrity", () => {
  it("first solution move is legal in the starting position", () => {
    for (const pos of ENDGAME_POSITIONS) {
      expect(
        pos.solution.length,
        `${pos.id} should have at least 1 solution move`
      ).toBeGreaterThanOrEqual(1);

      const game = new Chess(pos.fen);
      const firstMove = pos.solution[0];
      const result = game.move(firstMove.san);
      expect(
        result,
        `${pos.id}: first solution move '${firstMove.san}' is illegal at FEN ${pos.fen}`
      ).not.toBeNull();
    }
  });
});

describe("getEndgameById", () => {
  it("returns the correct position for a valid ID", () => {
    const position = getEndgameById("kr-vs-k-1");
    expect(position).toBeDefined();
    expect(position?.name).toBe("King + Rook vs King");
  });

  it("returns undefined for an invalid ID", () => {
    expect(getEndgameById("nonexistent-id")).toBeUndefined();
  });
});

describe("getEndgamesByCategory", () => {
  it("returns only positions matching the requested category", () => {
    const rookEndgames = getEndgamesByCategory("rook-endgame");
    expect(rookEndgames.length).toBeGreaterThan(0);
    for (const pos of rookEndgames) {
      expect(pos.category).toBe("rook-endgame");
    }
  });

  it("returns an empty array for a category with no positions", () => {
    const knightEndgames = getEndgamesByCategory("king-knight");
    expect(knightEndgames).toEqual([]);
  });
});

describe("getEndgamesByDifficulty", () => {
  it("returns only beginner positions when filtered by beginner", () => {
    const beginnerPositions = getEndgamesByDifficulty("beginner");
    expect(beginnerPositions.length).toBeGreaterThan(0);
    for (const pos of beginnerPositions) {
      expect(pos.difficulty).toBe("beginner");
    }
  });

  it("returns only intermediate positions when filtered by intermediate", () => {
    const intermediatePositions = getEndgamesByDifficulty("intermediate");
    expect(intermediatePositions.length).toBeGreaterThan(0);
    for (const pos of intermediatePositions) {
      expect(pos.difficulty).toBe("intermediate");
    }
  });

  it("returns only advanced positions when filtered by advanced", () => {
    const advancedPositions = getEndgamesByDifficulty("advanced");
    expect(advancedPositions.length).toBeGreaterThan(0);
    for (const pos of advancedPositions) {
      expect(pos.difficulty).toBe("advanced");
    }
  });
});

describe("getEndgameCategories", () => {
  it("returns unique categories", () => {
    const categories = getEndgameCategories();
    expect(new Set(categories).size).toBe(categories.length);
  });

  it("includes categories present in the catalog", () => {
    const categories = getEndgameCategories();
    const catalogCategories = new Set(
      ENDGAME_POSITIONS.map((e) => e.category)
    );
    for (const cat of catalogCategories) {
      expect(categories).toContain(cat);
    }
  });
});
