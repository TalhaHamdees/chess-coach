import { describe, it, expect } from "vitest";
import { validateCoachMoves, extractSANTokens } from "./move-validator";
import type { CoachResponse } from "@/types/coach";

/** Starting position FEN — white to move */
const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Position after 1. e4 e5 2. Nf3 Nc6 3. Nc3
 * White: Nc3 blocks the c1 bishop — Bd2 is illegal.
 * FEN: r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 3 3
 */
const NC3_BLOCKS_BISHOP_FEN =
  "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R b KQkq - 3 3";

/** After 1. e4 — black to move */
const AFTER_E4_FEN =
  "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";

function makeResponse(overrides: Partial<CoachResponse> = {}): CoachResponse {
  return {
    message: "Good move!",
    fen: null,
    arrows: [],
    highlights: [],
    engineMove: null,
    suggestedMove: null,
    moveQuality: null,
    ...overrides,
  };
}

describe("validateCoachMoves", () => {
  describe("engineMove validation", () => {
    it("keeps a legal engineMove", () => {
      const response = makeResponse({ engineMove: "e2-e4" });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.engineMove).toBe("e2-e4");
    });

    it("nulls an illegal engineMove", () => {
      // From starting position, e2-e5 is not legal
      const response = makeResponse({ engineMove: "e2-e5" });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.engineMove).toBeNull();
    });

    it("keeps null engineMove as null", () => {
      const response = makeResponse({ engineMove: null });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.engineMove).toBeNull();
    });
  });

  describe("suggestedMove validation", () => {
    it("keeps a legal suggestedMove", () => {
      const response = makeResponse({ suggestedMove: "g1-f3" });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.suggestedMove).toBe("g1-f3");
    });

    it("nulls an illegal suggestedMove", () => {
      // From starting position, g1-g3 is not a legal knight move
      const response = makeResponse({ suggestedMove: "g1-g3" });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.suggestedMove).toBeNull();
    });
  });

  describe("message SAN validation", () => {
    it("leaves message unchanged when all referenced moves are legal", () => {
      const response = makeResponse({
        message: "You should play Nf3, which develops the knight.",
      });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.message).toBe(
        "You should play Nf3, which develops the knight."
      );
    });

    it("appends correction when message mentions an illegal move", () => {
      // In NC3_BLOCKS_BISHOP_FEN it's black to move; Bd2 is not a legal black move
      const response = makeResponse({
        message:
          "In this position, Bd2 is a valid move for developing the bishop.",
      });
      const result = validateCoachMoves(response, NC3_BLOCKS_BISHOP_FEN);
      expect(result.message).toContain("**Correction:**");
      expect(result.message).toContain('"Bd2"');
      expect(result.message).toContain("not legal");
    });

    it("appends correction listing multiple illegal moves", () => {
      const response = makeResponse({
        message:
          "You could play Bd2 or Qh5 here, both are strong moves for development.",
      });
      const result = validateCoachMoves(response, NC3_BLOCKS_BISHOP_FEN);
      expect(result.message).toContain("**Correction:**");
      expect(result.message).toContain('"Bd2"');
      expect(result.message).toContain('"Qh5"');
      expect(result.message).toContain("are not legal");
    });

    it("does not modify message with no chess moves", () => {
      const response = makeResponse({
        message: "Welcome to chess! Let me help you learn.",
      });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.message).toBe("Welcome to chess! Let me help you learn.");
    });

    it("validates castling notation (O-O and O-O-O)", () => {
      // Starting position — castling is not immediately legal (pieces in the way)
      const response = makeResponse({
        message: "You can castle kingside with O-O right away!",
      });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.message).toContain("**Correction:**");
      expect(result.message).toContain("O-O");
    });

    it("accepts castling when it is legal", () => {
      // Position where white can castle kingside: king on e1, rook on h1, f1/g1 clear
      const castleFEN =
        "rnbqkbnr/pppppppp/8/8/8/5NP1/PPPPPPBP/RNBQK2R w KQkq - 0 1";
      const response = makeResponse({
        message: "You can castle kingside with O-O to get your king safe.",
      });
      const result = validateCoachMoves(response, castleFEN);
      expect(result.message).not.toContain("**Correction:**");
    });

    it("handles capture notation (exd5, Qxf7+)", () => {
      // After 1. e4 e5: black has pawn on e5, no pawn on d5 — exd5 is illegal for black
      // But e5 is already played, so after e4 d5 we can test exd5
      const afterD5 =
        "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
      const response = makeResponse({
        message: "White can capture with exd5 here.",
      });
      const result = validateCoachMoves(response, afterD5);
      expect(result.message).not.toContain("**Correction:**");
    });

    it("validates pawn pushes in chess context", () => {
      const response = makeResponse({
        message: "You should play e4 to control the center square.",
      });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.message).not.toContain("**Correction:**");
    });

    it("flags illegal pawn push in chess context", () => {
      const response = makeResponse({
        message: "The move e5 is a strong pawn push here.",
      });
      // From starting position, e5 is not legal (only e3 or e4)
      const result = validateCoachMoves(response, START_FEN);
      expect(result.message).toContain("**Correction:**");
      expect(result.message).toContain('"e5"');
    });
  });

  describe("edge cases", () => {
    it("returns response as-is for invalid FEN", () => {
      const response = makeResponse({
        engineMove: "e2-e4",
        message: "Play Nf3 here.",
      });
      const result = validateCoachMoves(response, "not-a-fen");
      expect(result).toEqual(response);
    });

    it("preserves other response fields (arrows, highlights, etc.)", () => {
      const response = makeResponse({
        arrows: [{ from: "e2", to: "e4", color: "green" }],
        highlights: ["e4"],
        moveQuality: "good",
        engineMove: "e2-e4",
      });
      const result = validateCoachMoves(response, START_FEN);
      expect(result.arrows).toEqual([
        { from: "e2", to: "e4", color: "green" },
      ]);
      expect(result.highlights).toEqual(["e4"]);
      expect(result.moveQuality).toBe("good");
    });

    it("includes legal alternatives in correction note", () => {
      const response = makeResponse({
        message: "Playing Bd2 develops the bishop nicely.",
      });
      const result = validateCoachMoves(response, NC3_BLOCKS_BISHOP_FEN);
      expect(result.message).toContain("Legal moves include:");
    });
  });
});

describe("extractSANTokens", () => {
  it("extracts piece moves", () => {
    const tokens = extractSANTokens("Play Nf3 and then Bc4.");
    expect(tokens).toContain("Nf3");
    expect(tokens).toContain("Bc4");
  });

  it("extracts castling", () => {
    const tokens = extractSANTokens("You can castle with O-O or O-O-O.");
    expect(tokens).toContain("O-O-O");
    expect(tokens).toContain("O-O");
  });

  it("extracts pawn captures", () => {
    const tokens = extractSANTokens("After the move exd5, the pawn recaptures.");
    expect(tokens).toContain("exd5");
  });

  it("extracts pawn pushes only in chess context", () => {
    const chessContext = extractSANTokens("You should play e4 to develop.");
    expect(chessContext).toContain("e4");

    const noContext = extractSANTokens("Room e4 is on the left.");
    expect(noContext).not.toContain("e4");
  });

  it("deduplicates tokens", () => {
    const tokens = extractSANTokens("Nf3 is good. Play Nf3.");
    expect(tokens.filter((t) => t === "Nf3")).toHaveLength(1);
  });
});
