import { describe, it, expect } from "vitest";
import {
  fenToBoardMap,
  boardMapToFen,
  isValidSetupPosition,
  EMPTY_BOARD_MAP,
  START_BOARD_MAP,
  type BoardMap,
} from "./fen";

describe("fenToBoardMap", () => {
  it("parses starting position correctly", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const map = fenToBoardMap(fen);
    expect(map.size).toBe(32);
    // White pieces on rank 1
    expect(map.get("a1")).toEqual({ type: "r", color: "w" });
    expect(map.get("e1")).toEqual({ type: "k", color: "w" });
    expect(map.get("d1")).toEqual({ type: "q", color: "w" });
    // Black pieces on rank 8
    expect(map.get("a8")).toEqual({ type: "r", color: "b" });
    expect(map.get("e8")).toEqual({ type: "k", color: "b" });
    // Pawns
    expect(map.get("e2")).toEqual({ type: "p", color: "w" });
    expect(map.get("e7")).toEqual({ type: "p", color: "b" });
  });

  it("parses empty board", () => {
    const fen = "8/8/8/8/8/8/8/8 w - - 0 1";
    const map = fenToBoardMap(fen);
    expect(map.size).toBe(0);
  });

  it("parses a custom position with mixed empty squares", () => {
    // Only two kings
    const fen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
    const map = fenToBoardMap(fen);
    expect(map.size).toBe(2);
    expect(map.get("e8")).toEqual({ type: "k", color: "b" });
    expect(map.get("e1")).toEqual({ type: "k", color: "w" });
  });

  it("parses position with pieces on various files", () => {
    const fen = "r1b1k1nr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const map = fenToBoardMap(fen);
    expect(map.get("a8")).toEqual({ type: "r", color: "b" });
    expect(map.get("b8")).toBeUndefined();
    expect(map.get("c8")).toEqual({ type: "b", color: "b" });
    expect(map.get("d8")).toBeUndefined();
    expect(map.get("e8")).toEqual({ type: "k", color: "b" });
  });

  it("parses all piece types", () => {
    const fen = "knbrqp2/KNBRQP2/8/8/8/8/8/8 w - - 0 1";
    const map = fenToBoardMap(fen);
    expect(map.get("a8")).toEqual({ type: "k", color: "b" });
    expect(map.get("b8")).toEqual({ type: "n", color: "b" });
    expect(map.get("c8")).toEqual({ type: "b", color: "b" });
    expect(map.get("d8")).toEqual({ type: "r", color: "b" });
    expect(map.get("e8")).toEqual({ type: "q", color: "b" });
    expect(map.get("f8")).toEqual({ type: "p", color: "b" });
    expect(map.get("a7")).toEqual({ type: "k", color: "w" });
    expect(map.get("b7")).toEqual({ type: "n", color: "w" });
    expect(map.get("c7")).toEqual({ type: "b", color: "w" });
    expect(map.get("d7")).toEqual({ type: "r", color: "w" });
    expect(map.get("e7")).toEqual({ type: "q", color: "w" });
    expect(map.get("f7")).toEqual({ type: "p", color: "w" });
  });
});

describe("boardMapToFen", () => {
  it("converts empty board to correct FEN", () => {
    const map: BoardMap = new Map();
    const fen = boardMapToFen(map);
    expect(fen).toBe("8/8/8/8/8/8/8/8 w - - 0 1");
  });

  it("converts starting position board map", () => {
    const fen = boardMapToFen(START_BOARD_MAP);
    expect(fen).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w - - 0 1");
  });

  it("respects turn option", () => {
    const map: BoardMap = new Map();
    const fen = boardMapToFen(map, { turn: "b" });
    expect(fen).toContain(" b ");
  });

  it("respects castling option", () => {
    const fen = boardMapToFen(START_BOARD_MAP, { castling: "KQkq" });
    expect(fen).toContain(" KQkq ");
  });

  it("respects en passant option", () => {
    const fen = boardMapToFen(new Map(), { enPassant: "e3" });
    expect(fen).toContain(" e3 ");
  });

  it("respects halfmove and fullmove options", () => {
    const fen = boardMapToFen(new Map(), { halfmove: 5, fullmove: 10 });
    expect(fen.endsWith(" 5 10")).toBe(true);
  });

  it("handles position with just two kings", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
    ]);
    const fen = boardMapToFen(map);
    expect(fen).toBe("4k3/8/8/8/8/8/8/4K3 w - - 0 1");
  });

  it("handles pieces on the same rank with gaps", () => {
    const map: BoardMap = new Map([
      ["a1", { type: "r", color: "w" }],
      ["h1", { type: "r", color: "w" }],
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
    ]);
    const fen = boardMapToFen(map);
    expect(fen.split(" ")[0]).toBe("4k3/8/8/8/8/8/8/R3K2R");
  });
});

describe("round-trip: fenToBoardMap → boardMapToFen", () => {
  it("round-trips starting position placement", () => {
    const originalFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const map = fenToBoardMap(originalFen);
    const result = boardMapToFen(map, { castling: "KQkq" });
    expect(result).toBe(originalFen);
  });

  it("round-trips empty board", () => {
    const originalFen = "8/8/8/8/8/8/8/8 w - - 0 1";
    const map = fenToBoardMap(originalFen);
    const result = boardMapToFen(map);
    expect(result).toBe(originalFen);
  });

  it("round-trips a complex mid-game position", () => {
    const placement = "r1bqkb1r/pppppppp/2n2n2/8/4P3/5N2/PPPP1PPP/RNBQKB1R";
    const fen = `${placement} w KQkq - 2 3`;
    const map = fenToBoardMap(fen);
    const result = boardMapToFen(map, { castling: "KQkq", halfmove: 2, fullmove: 3 });
    expect(result).toBe(fen);
  });
});

describe("isValidSetupPosition", () => {
  it("rejects empty board (no kings)", () => {
    const result = isValidSetupPosition(EMPTY_BOARD_MAP);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("White king");
  });

  it("rejects board with only white king", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Black king");
  });

  it("rejects board with only black king", () => {
    const map: BoardMap = new Map([
      ["e8", { type: "k", color: "b" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("White king");
  });

  it("accepts board with both kings", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts starting position", () => {
    const result = isValidSetupPosition(START_BOARD_MAP);
    expect(result.valid).toBe(true);
  });

  it("rejects two white kings", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
      ["d1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Too many white kings");
  });

  it("rejects two black kings", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
      ["d8", { type: "k", color: "b" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Too many black kings");
  });

  it("rejects too many white pawns (>8)", () => {
    const map: BoardMap = new Map<string, { type: "p" | "k"; color: "w" | "b" }>([
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
      ["a2", { type: "p", color: "w" }],
      ["b2", { type: "p", color: "w" }],
      ["c2", { type: "p", color: "w" }],
      ["d2", { type: "p", color: "w" }],
      ["e2", { type: "p", color: "w" }],
      ["f2", { type: "p", color: "w" }],
      ["g2", { type: "p", color: "w" }],
      ["h2", { type: "p", color: "w" }],
      ["a3", { type: "p", color: "w" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Too many white pawns");
  });

  it("rejects pawns on rank 1", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
      ["a1", { type: "p", color: "w" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("first or eighth rank");
  });

  it("rejects pawns on rank 8", () => {
    const map: BoardMap = new Map([
      ["e1", { type: "k", color: "w" }],
      ["e8", { type: "k", color: "b" }],
      ["a8", { type: "p", color: "b" }],
    ]);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("first or eighth rank");
  });

  it("accepts a valid mid-game position", () => {
    const fen = "r1bqkb1r/pppppppp/2n2n2/8/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3";
    const map = fenToBoardMap(fen);
    const result = isValidSetupPosition(map);
    expect(result.valid).toBe(true);
  });
});

describe("constants", () => {
  it("EMPTY_BOARD_MAP has no pieces", () => {
    expect(EMPTY_BOARD_MAP.size).toBe(0);
  });

  it("START_BOARD_MAP has 32 pieces", () => {
    expect(START_BOARD_MAP.size).toBe(32);
  });

  it("START_BOARD_MAP is a new Map instance (not mutating original)", () => {
    // Ensure it's not the same reference
    expect(START_BOARD_MAP).not.toBe(EMPTY_BOARD_MAP);
  });
});
