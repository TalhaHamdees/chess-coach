import { describe, it, expect, vi, beforeEach } from "vitest";
import { parsePGN, isLichessGameUrl, extractLichessGameId, fetchLichessGamePGN } from "./pgn";

// A simple valid PGN (Scholar's Mate)
const SCHOLARS_MATE_PGN = `[Event "Casual Game"]
[Site "Internet"]
[Date "2024.01.15"]
[White "Alice"]
[Black "Bob"]
[Result "1-0"]
[WhiteElo "1500"]
[BlackElo "1200"]
[ECO "C20"]

1. e4 e5 2. Qh5 Nc6 3. Bc4 Nf6 4. Qxf7# 1-0`;

// A short 2-move PGN
const SHORT_PGN = `[White "Player1"]
[Black "Player2"]
[Result "*"]

1. e4 e5 *`;

describe("parsePGN", () => {
  it("parses a valid PGN and extracts headers", () => {
    const game = parsePGN(SCHOLARS_MATE_PGN);
    expect(game.headers.white).toBe("Alice");
    expect(game.headers.black).toBe("Bob");
    expect(game.headers.result).toBe("1-0");
    expect(game.headers.event).toBe("Casual Game");
    expect(game.headers.whiteElo).toBe("1500");
    expect(game.headers.blackElo).toBe("1200");
    expect(game.headers.eco).toBe("C20");
  });

  it("extracts the correct number of moves", () => {
    const game = parsePGN(SCHOLARS_MATE_PGN);
    // 7 half-moves: e4, e5, Qh5, Nc6, Bc4, Nf6, Qxf7#
    expect(game.moves).toHaveLength(7);
  });

  it("captures FEN at each position", () => {
    const game = parsePGN(SHORT_PGN);
    expect(game.moves).toHaveLength(2);

    // After 1. e4 — white pawn on e4
    expect(game.moves[0].fen).toContain("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
    // After 1... e5 — black pawn on e5
    expect(game.moves[1].fen).toContain("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR");
  });

  it("records from/to squares for each move", () => {
    const game = parsePGN(SHORT_PGN);
    expect(game.moves[0].san).toBe("e4");
    expect(game.moves[0].from).toBe("e2");
    expect(game.moves[0].to).toBe("e4");
    expect(game.moves[1].san).toBe("e5");
    expect(game.moves[1].from).toBe("e7");
    expect(game.moves[1].to).toBe("e5");
  });

  it("uses the standard starting FEN by default", () => {
    const game = parsePGN(SHORT_PGN);
    expect(game.startingFen).toBe(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
    );
  });

  it("extracts the result", () => {
    const game = parsePGN(SCHOLARS_MATE_PGN);
    expect(game.result).toBe("1-0");
  });

  it("returns null result when not set", () => {
    const game = parsePGN(`1. e4 e5`);
    expect(game.result).toBeNull();
  });

  it("throws on invalid PGN", () => {
    expect(() => parsePGN("this is not valid pgn 1. Zz9")).toThrow();
  });

  it("parses PGN without headers", () => {
    const game = parsePGN("1. d4 d5 2. c4 e6");
    expect(game.moves).toHaveLength(4);
    expect(game.moves[0].san).toBe("d4");
    expect(game.moves[3].san).toBe("e6");
  });
});

describe("isLichessGameUrl", () => {
  it("accepts valid Lichess game URLs", () => {
    expect(isLichessGameUrl("https://lichess.org/abcdefgh")).toBe(true);
    expect(isLichessGameUrl("https://lichess.org/abcdefgh/black")).toBe(true);
    expect(isLichessGameUrl("https://www.lichess.org/abcdefgh")).toBe(true);
    expect(isLichessGameUrl("https://lichess.org/abcdefghijkl")).toBe(true);
  });

  it("rejects invalid URLs", () => {
    expect(isLichessGameUrl("not a url")).toBe(false);
    expect(isLichessGameUrl("https://chess.com/game/123")).toBe(false);
    expect(isLichessGameUrl("https://lichess.org/")).toBe(false);
    expect(isLichessGameUrl("https://lichess.org/ab")).toBe(false);
  });
});

describe("extractLichessGameId", () => {
  it("extracts game ID from standard URL", () => {
    expect(extractLichessGameId("https://lichess.org/abcdefgh")).toBe("abcdefgh");
  });

  it("extracts game ID from URL with color suffix", () => {
    expect(extractLichessGameId("https://lichess.org/abcdefgh/black")).toBe("abcdefgh");
  });

  it("truncates 12-char IDs to 8 chars", () => {
    expect(extractLichessGameId("https://lichess.org/abcdefghijkl")).toBe("abcdefgh");
  });
});

describe("fetchLichessGamePGN", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches PGN from a valid Lichess URL", async () => {
    const mockPgn = "1. e4 e5 2. Nf3 Nc6";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockPgn),
    }));

    const result = await fetchLichessGamePGN("https://lichess.org/abcdefgh");
    expect(result).toBe(mockPgn);
    expect(fetch).toHaveBeenCalledWith(
      "https://lichess.org/game/export/abcdefgh?clocks=false&evals=false",
      { headers: { Accept: "application/x-chess-pgn" } }
    );
  });

  it("throws on invalid Lichess URL", async () => {
    await expect(fetchLichessGamePGN("https://chess.com/game")).rejects.toThrow(
      "Invalid Lichess game URL"
    );
  });

  it("throws on fetch failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    await expect(
      fetchLichessGamePGN("https://lichess.org/abcdefgh")
    ).rejects.toThrow("Failed to fetch game from Lichess (404)");
  });

  it("throws on empty PGN response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve("  "),
    }));

    await expect(
      fetchLichessGamePGN("https://lichess.org/abcdefgh")
    ).rejects.toThrow("Empty PGN received from Lichess");
  });
});
