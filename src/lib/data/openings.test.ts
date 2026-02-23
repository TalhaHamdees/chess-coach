import { describe, it, expect } from "vitest";
import { Chess } from "chess.js";
import {
  OPENINGS,
  getOpeningById,
  getOpeningsByCategory,
  getOpeningCategories,
} from "./openings";
import { validateFEN } from "@/lib/chess/engine";
import type { OpeningCategory, OpeningDifficulty } from "@/types/opening";

describe("OPENINGS catalog", () => {
  it("has at least 10 openings", () => {
    expect(OPENINGS.length).toBeGreaterThanOrEqual(10);
  });

  it("has unique IDs across all openings", () => {
    const ids = OPENINGS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique variation IDs within each opening", () => {
    for (const opening of OPENINGS) {
      const varIds = opening.variations.map((v) => v.id);
      expect(new Set(varIds).size).toBe(varIds.length);
    }
  });

  it("has non-empty required fields on every opening", () => {
    for (const opening of OPENINGS) {
      expect(opening.id).toBeTruthy();
      expect(opening.name).toBeTruthy();
      expect(opening.eco).toBeTruthy();
      expect(opening.description).toBeTruthy();
      expect(opening.keyIdeas.length).toBeGreaterThan(0);
      expect(opening.variations.length).toBeGreaterThan(0);
    }
  });

  it("uses valid categories on every opening", () => {
    const validCategories: OpeningCategory[] = ["e4", "d4", "other"];
    for (const opening of OPENINGS) {
      expect(validCategories).toContain(opening.category);
    }
  });

  it("uses valid difficulty levels on every opening", () => {
    const validDifficulties: OpeningDifficulty[] = [
      "beginner",
      "intermediate",
      "advanced",
    ];
    for (const opening of OPENINGS) {
      expect(validDifficulties).toContain(opening.difficulty);
    }
  });

  it("has valid ECO codes (letter + 2 digits)", () => {
    for (const opening of OPENINGS) {
      expect(opening.eco).toMatch(/^[A-E]\d{2}$/);
    }
  });

  it("has valid playerColor on every opening", () => {
    for (const opening of OPENINGS) {
      expect(["w", "b"]).toContain(opening.playerColor);
    }
  });
});

describe("FEN validity", () => {
  it("has valid startingFen on every opening", () => {
    for (const opening of OPENINGS) {
      const result = validateFEN(opening.startingFen);
      expect(result.ok, `${opening.name} startingFen: ${result.error}`).toBe(
        true
      );
    }
  });

  it("has valid finalFen on every variation", () => {
    for (const opening of OPENINGS) {
      for (const variation of opening.variations) {
        const result = validateFEN(variation.finalFen);
        expect(
          result.ok,
          `${opening.name}/${variation.name} finalFen: ${result.error}`
        ).toBe(true);
      }
    }
  });
});

describe("Move integrity", () => {
  it("alternates colors correctly in every variation", () => {
    for (const opening of OPENINGS) {
      for (const variation of opening.variations) {
        for (let i = 1; i < variation.moves.length; i++) {
          const prev = variation.moves[i - 1];
          const curr = variation.moves[i];
          expect(
            curr.color,
            `${opening.name}/${variation.name} move ${i}: expected alternating colors`
          ).not.toBe(prev.color);
        }
      }
    }
  });

  it("has valid move numbers (increment after Black moves)", () => {
    for (const opening of OPENINGS) {
      for (const variation of opening.variations) {
        for (let i = 1; i < variation.moves.length; i++) {
          const prev = variation.moves[i - 1];
          const curr = variation.moves[i];
          if (prev.color === "b") {
            expect(
              curr.moveNumber,
              `${opening.name}/${variation.name} move ${i}`
            ).toBe(prev.moveNumber + 1);
          } else {
            expect(
              curr.moveNumber,
              `${opening.name}/${variation.name} move ${i}`
            ).toBe(prev.moveNumber);
          }
        }
      }
    }
  });

  it("every variation is playable from startingFen to finalFen", () => {
    for (const opening of OPENINGS) {
      for (const variation of opening.variations) {
        const game = new Chess(opening.startingFen);

        for (const move of variation.moves) {
          const result = game.move(move.san);
          expect(
            result,
            `${opening.name}/${variation.name}: illegal move ${move.san} at ${game.fen()}`
          ).not.toBeNull();
        }

        // Compare only the board position part of FEN (first 4 fields)
        // to avoid en-passant/halfmove differences
        const actualParts = game.fen().split(" ");
        const expectedParts = variation.finalFen.split(" ");
        expect(
          actualParts[0],
          `${opening.name}/${variation.name}: final position mismatch`
        ).toBe(expectedParts[0]);
      }
    }
  });
});

describe("getOpeningById", () => {
  it("returns the correct opening for a valid ID", () => {
    const italian = getOpeningById("italian-game");
    expect(italian).toBeDefined();
    expect(italian?.name).toBe("Italian Game");
  });

  it("returns undefined for an invalid ID", () => {
    expect(getOpeningById("nonexistent")).toBeUndefined();
  });
});

describe("getOpeningsByCategory", () => {
  it("returns only e4 openings when filtered by e4", () => {
    const e4Openings = getOpeningsByCategory("e4");
    expect(e4Openings.length).toBeGreaterThan(0);
    for (const opening of e4Openings) {
      expect(opening.category).toBe("e4");
    }
  });

  it("returns only d4 openings when filtered by d4", () => {
    const d4Openings = getOpeningsByCategory("d4");
    expect(d4Openings.length).toBeGreaterThan(0);
    for (const opening of d4Openings) {
      expect(opening.category).toBe("d4");
    }
  });

  it("returns other openings", () => {
    const otherOpenings = getOpeningsByCategory("other");
    expect(otherOpenings.length).toBeGreaterThan(0);
    for (const opening of otherOpenings) {
      expect(opening.category).toBe("other");
    }
  });
});

describe("getOpeningCategories", () => {
  it("returns all three categories", () => {
    const categories = getOpeningCategories();
    expect(categories).toContain("e4");
    expect(categories).toContain("d4");
    expect(categories).toContain("other");
  });
});
