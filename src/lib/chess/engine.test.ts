import { describe, it, expect } from "vitest";
import {
  createGame,
  makeMove,
  getValidMoves,
  isCheck,
  isCheckmate,
  getGameStatus,
  parseFEN,
  validateFEN,
  getPiece,
  getMoveHistory,
  getFEN,
  DEFAULT_POSITION,
} from "./engine";

describe("createGame", () => {
  it("creates a game with starting position by default", () => {
    const game = createGame();
    expect(game.fen()).toBe(DEFAULT_POSITION);
  });

  it("creates a game from a valid FEN", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1";
    const game = createGame(fen);
    expect(game.fen()).toBe(fen);
  });

  it("throws on invalid FEN", () => {
    expect(() => createGame("invalid-fen")).toThrow("Invalid FEN");
  });
});

describe("makeMove", () => {
  it("makes a valid move and returns new game state", () => {
    const game = createGame();
    const { game: newGame, result } = makeMove(game, {
      from: "e2",
      to: "e4",
    });

    expect(result.success).toBe(true);
    expect(result.san).toBe("e4");
    expect(result.fen).toContain("4P3");
    // Original game should not be mutated
    expect(game.fen()).toBe(DEFAULT_POSITION);
    expect(newGame.fen()).not.toBe(DEFAULT_POSITION);
  });

  it("returns failure for an illegal move", () => {
    const game = createGame();
    const { result } = makeMove(game, { from: "e2", to: "e5" });

    expect(result.success).toBe(false);
    expect(result.san).toBe("");
  });

  it("detects capture", () => {
    // Position where e4 pawn can capture d5 pawn
    const fen =
      "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq d6 0 2";
    const game = createGame(fen);
    const { result } = makeMove(game, { from: "e4", to: "d5" });

    expect(result.success).toBe(true);
    expect(result.captured).toBe("p");
  });

  it("handles pawn promotion", () => {
    // White pawn on e7 ready to promote, black king far away
    const fen = "8/4P3/8/8/8/8/k7/4K3 w - - 0 1";
    const game = createGame(fen);
    const { result } = makeMove(game, {
      from: "e7",
      to: "e8",
      promotion: "q",
    });

    expect(result.success).toBe(true);
    expect(result.san).toBe("e8=Q");
  });

  it("detects check after move", () => {
    // Position where Qxf7 gives check (Scholar's mate without Nf6)
    const fen =
      "rnbqkbnr/pppp1ppp/8/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 3 3";
    const game = createGame(fen);
    const { result } = makeMove(game, { from: "h5", to: "f7" });

    expect(result.success).toBe(true);
    expect(result.isCheck).toBe(true);
  });

  it("detects checkmate", () => {
    // Scholar's mate position - Qxf7#
    const fen =
      "rnbqkb1r/pppp1ppp/5n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4";
    const game = createGame(fen);
    const { result } = makeMove(game, { from: "h5", to: "f7" });

    expect(result.success).toBe(true);
    expect(result.isCheckmate).toBe(true);
  });
});

describe("getValidMoves", () => {
  it("returns all valid moves from starting position", () => {
    const game = createGame();
    const moves = getValidMoves(game);

    // 20 possible first moves for white (16 pawn + 4 knight)
    expect(moves).toHaveLength(20);
  });

  it("returns valid moves for a specific square", () => {
    const game = createGame();
    const moves = getValidMoves(game, "e2");

    expect(moves).toHaveLength(2); // e3 and e4
    expect(moves.map((m) => m.to)).toContain("e3");
    expect(moves.map((m) => m.to)).toContain("e4");
  });

  it("returns empty array for a square with no valid moves", () => {
    const game = createGame();
    const moves = getValidMoves(game, "e1");

    expect(moves).toHaveLength(0); // King is blocked at start
  });
});

describe("isCheck / isCheckmate", () => {
  it("returns false for starting position", () => {
    const game = createGame();
    expect(isCheck(game)).toBe(false);
    expect(isCheckmate(game)).toBe(false);
  });

  it("detects check", () => {
    // Black king in check: white rook on e-file, black king on e8
    const fen = "4k3/8/8/8/8/8/4R3/4K3 b - - 0 1";
    const game = createGame(fen);
    expect(isCheck(game)).toBe(true);
  });
});

describe("getGameStatus", () => {
  it("returns correct status for starting position", () => {
    const game = createGame();
    const status = getGameStatus(game);

    expect(status.isCheck).toBe(false);
    expect(status.isCheckmate).toBe(false);
    expect(status.isDraw).toBe(false);
    expect(status.isStalemate).toBe(false);
    expect(status.isGameOver).toBe(false);
    expect(status.turn).toBe("w");
  });

  it("identifies black's turn", () => {
    const game = createGame();
    makeMove(game, { from: "e2", to: "e4" }); // This creates a new game
    const afterE4 = createGame(
      "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"
    );
    const status = getGameStatus(afterE4);
    expect(status.turn).toBe("b");
  });

  it("detects stalemate", () => {
    // Classic stalemate: Black king on a8, white queen on b6, white king on c1
    const fen = "k7/8/1Q6/8/8/8/8/2K5 b - - 0 1";
    const game = createGame(fen);
    const status = getGameStatus(game);

    expect(status.isStalemate).toBe(true);
    expect(status.isGameOver).toBe(true);
    expect(status.isCheckmate).toBe(false);
  });
});

describe("parseFEN / validateFEN", () => {
  it("parses a valid FEN string", () => {
    const fen = DEFAULT_POSITION;
    expect(parseFEN(fen)).toBe(fen);
  });

  it("parses FEN after 1.e4 e5", () => {
    const fen =
      "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq e6 0 2";
    expect(parseFEN(fen)).toBe(fen);
  });

  it("throws on invalid FEN", () => {
    expect(() => parseFEN("not-a-fen")).toThrow("Invalid FEN");
  });

  it("validates a correct FEN", () => {
    const result = validateFEN(DEFAULT_POSITION);
    expect(result.ok).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects an invalid FEN with error message", () => {
    const result = validateFEN("garbage");
    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe("getPiece", () => {
  it("returns the piece at a given square", () => {
    const game = createGame();

    const whiteKing = getPiece(game, "e1");
    expect(whiteKing).toEqual({ type: "k", color: "w" });

    const blackQueen = getPiece(game, "d8");
    expect(blackQueen).toEqual({ type: "q", color: "b" });

    const whitePawn = getPiece(game, "e2");
    expect(whitePawn).toEqual({ type: "p", color: "w" });
  });

  it("returns null for an empty square", () => {
    const game = createGame();
    expect(getPiece(game, "e4")).toBeNull();
  });
});

describe("getMoveHistory", () => {
  it("returns empty array for new game", () => {
    const game = createGame();
    expect(getMoveHistory(game)).toEqual([]);
  });

  it("tracks moves as SAN strings", () => {
    const game = createGame();
    game.move("e4");
    game.move("e5");
    game.move("Nf3");

    expect(getMoveHistory(game)).toEqual(["e4", "e5", "Nf3"]);
  });
});

describe("getFEN", () => {
  it("returns the current FEN", () => {
    const game = createGame();
    expect(getFEN(game)).toBe(DEFAULT_POSITION);
  });
});
