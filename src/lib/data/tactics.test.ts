import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  TACTICS_PUZZLES,
  getPuzzleById,
  getPuzzlesByTheme,
  getPuzzlesByDifficulty,
  getTacticsThemes,
} from "./tactics";

describe("TACTICS_PUZZLES catalog", () => {
  it("has 12 puzzles", () => {
    expect(TACTICS_PUZZLES.length).toBe(12);
  });

  it("has unique IDs across all puzzles", () => {
    const ids = TACTICS_PUZZLES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has non-empty required fields on every puzzle", () => {
    for (const puzzle of TACTICS_PUZZLES) {
      expect(puzzle.id).toBeTruthy();
      expect(puzzle.name).toBeTruthy();
      expect(puzzle.theme).toBeTruthy();
      expect(puzzle.difficulty).toBeTruthy();
      expect(puzzle.description).toBeTruthy();
      expect(puzzle.playerColor).toBeTruthy();
      expect(puzzle.fen).toBeTruthy();
      expect(puzzle.solution.length).toBeGreaterThan(0);
      expect(puzzle.hints.length).toBeGreaterThan(0);
    }
  });

  it("has at least 1 hint on every puzzle", () => {
    for (const puzzle of TACTICS_PUZZLES) {
      expect(
        puzzle.hints.length,
        `${puzzle.name} should have at least 1 hint`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("has valid playerColor ('w' or 'b') on every puzzle", () => {
    for (const puzzle of TACTICS_PUZZLES) {
      expect(
        ["w", "b"],
        `${puzzle.name} playerColor should be 'w' or 'b'`
      ).toContain(puzzle.playerColor);
    }
  });

  it("uses valid difficulty levels on every puzzle", () => {
    const validDifficulties = ["beginner", "intermediate", "advanced"];
    for (const puzzle of TACTICS_PUZZLES) {
      expect(validDifficulties).toContain(puzzle.difficulty);
    }
  });
});

describe("FEN validity", () => {
  it("has valid FEN on every puzzle", () => {
    for (const puzzle of TACTICS_PUZZLES) {
      const game = new Chess();
      let valid = true;
      try {
        game.load(puzzle.fen);
      } catch {
        valid = false;
      }
      expect(
        valid,
        `${puzzle.name} (${puzzle.id}): FEN is invalid — ${puzzle.fen}`
      ).toBe(true);
    }
  });
});

describe("Solution move legality", () => {
  it("first solution move is legal in the starting position for every puzzle", () => {
    for (const puzzle of TACTICS_PUZZLES) {
      const game = new Chess(puzzle.fen);
      const firstMove = puzzle.solution[0];
      const result = game.move(firstMove.san);
      expect(
        result,
        `${puzzle.name} (${puzzle.id}): first solution move '${firstMove.san}' is illegal at FEN ${puzzle.fen}`
      ).not.toBeNull();
    }
  });
});

describe("getPuzzleById", () => {
  it("returns the correct puzzle for a valid ID", () => {
    const puzzle = getPuzzleById("back-rank-1");
    expect(puzzle).toBeDefined();
    expect(puzzle?.name).toBe("Back Rank Mate");
  });

  it("returns the correct puzzle for another valid ID", () => {
    const puzzle = getPuzzleById("knight-fork-1");
    expect(puzzle).toBeDefined();
    expect(puzzle?.name).toBe("Royal Knight Fork");
  });

  it("returns undefined for an invalid ID", () => {
    expect(getPuzzleById("nonexistent")).toBeUndefined();
  });

  it("returns undefined for an empty string ID", () => {
    expect(getPuzzleById("")).toBeUndefined();
  });
});

describe("getPuzzlesByTheme", () => {
  it("returns puzzles matching the fork theme", () => {
    const forkPuzzles = getPuzzlesByTheme("fork");
    expect(forkPuzzles.length).toBeGreaterThan(0);
    for (const puzzle of forkPuzzles) {
      const hasTheme =
        puzzle.theme === "fork" || puzzle.secondaryThemes?.includes("fork");
      expect(
        hasTheme,
        `${puzzle.name} should have theme 'fork'`
      ).toBe(true);
    }
  });

  it("returns puzzles matching the back-rank theme", () => {
    const backRankPuzzles = getPuzzlesByTheme("back-rank");
    expect(backRankPuzzles.length).toBeGreaterThan(0);
    for (const puzzle of backRankPuzzles) {
      const hasTheme =
        puzzle.theme === "back-rank" ||
        puzzle.secondaryThemes?.includes("back-rank");
      expect(hasTheme).toBe(true);
    }
  });

  it("includes puzzles with matching secondary themes", () => {
    const mateIn3Puzzles = getPuzzlesByTheme("mate-in-3");
    expect(mateIn3Puzzles.length).toBeGreaterThan(0);
    // The greek-gift-1 puzzle has "mate-in-3" as a secondary theme
    const greekGift = mateIn3Puzzles.find((p) => p.id === "greek-gift-1");
    expect(greekGift).toBeDefined();
  });

  it("returns empty array for a theme with no puzzles", () => {
    const decoyPuzzles = getPuzzlesByTheme("decoy");
    expect(decoyPuzzles).toEqual([]);
  });
});

describe("getPuzzlesByDifficulty", () => {
  it("returns only beginner puzzles when filtered by beginner", () => {
    const beginnerPuzzles = getPuzzlesByDifficulty("beginner");
    expect(beginnerPuzzles.length).toBeGreaterThan(0);
    for (const puzzle of beginnerPuzzles) {
      expect(puzzle.difficulty).toBe("beginner");
    }
  });

  it("returns only intermediate puzzles when filtered by intermediate", () => {
    const intermediatePuzzles = getPuzzlesByDifficulty("intermediate");
    expect(intermediatePuzzles.length).toBeGreaterThan(0);
    for (const puzzle of intermediatePuzzles) {
      expect(puzzle.difficulty).toBe("intermediate");
    }
  });

  it("returns only advanced puzzles when filtered by advanced", () => {
    const advancedPuzzles = getPuzzlesByDifficulty("advanced");
    expect(advancedPuzzles.length).toBeGreaterThan(0);
    for (const puzzle of advancedPuzzles) {
      expect(puzzle.difficulty).toBe("advanced");
    }
  });

  it("total puzzles across all difficulties equals catalog size", () => {
    const beginner = getPuzzlesByDifficulty("beginner").length;
    const intermediate = getPuzzlesByDifficulty("intermediate").length;
    const advanced = getPuzzlesByDifficulty("advanced").length;
    expect(beginner + intermediate + advanced).toBe(TACTICS_PUZZLES.length);
  });
});

describe("getTacticsThemes", () => {
  it("returns an array of themes", () => {
    const themes = getTacticsThemes();
    expect(Array.isArray(themes)).toBe(true);
    expect(themes.length).toBeGreaterThan(0);
  });

  it("returns unique themes (no duplicates)", () => {
    const themes = getTacticsThemes();
    expect(new Set(themes).size).toBe(themes.length);
  });

  it("includes primary themes from all puzzles", () => {
    const themes = getTacticsThemes();
    const primaryThemes = new Set(TACTICS_PUZZLES.map((p) => p.theme));
    for (const theme of primaryThemes) {
      expect(themes).toContain(theme);
    }
  });

  it("includes secondary themes from puzzles", () => {
    const themes = getTacticsThemes();
    // The greek-gift-1 puzzle has "mate-in-3" as a secondary theme
    expect(themes).toContain("mate-in-3");
  });
});
