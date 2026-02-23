import { Chess, DEFAULT_POSITION } from "chess.js";
import type { ParsedGame, GameHeaders, PositionRecord, FEN } from "@/types/chess";

/**
 * Parse a PGN string into a structured game representation.
 * Replays the game move-by-move to capture FEN at each position.
 */
export function parsePGN(pgn: string): ParsedGame {
  const game = new Chess();
  try {
    game.loadPgn(pgn);
  } catch {
    throw new Error("Invalid PGN: failed to parse");
  }

  // Verify we actually parsed some moves (catch silent failures)
  const historyCheck = game.history();
  if (historyCheck.length === 0 && pgn.trim().length > 0) {
    // Could be a headers-only PGN with no moves — that's fine if it has headers
    // But if there's move text that wasn't parsed, it's invalid
    const strippedHeaders = pgn.replace(/\[.*?\]\s*/g, "").trim();
    // If there's move-like text but no moves were parsed, it might be invalid
    if (strippedHeaders.length > 0 && /\d+\./.test(strippedHeaders)) {
      throw new Error("Invalid PGN: failed to parse");
    }
  }

  // Extract headers
  const rawHeaders = game.header();
  const headers: GameHeaders = {};
  const headerKeyMap: Record<string, string> = {
    WhiteElo: "whiteElo",
    BlackElo: "blackElo",
    ECO: "eco",
  };
  for (const [key, value] of Object.entries(rawHeaders)) {
    if (value == null) continue;
    const camelKey = headerKeyMap[key] ?? key.charAt(0).toLowerCase() + key.slice(1);
    headers[camelKey] = value as string;
  }

  // Get verbose move history
  const verboseMoves = game.history({ verbose: true });

  // Determine starting FEN (from SetUp/FEN headers or default)
  const startingFen: FEN = rawHeaders["FEN"] ?? DEFAULT_POSITION;

  // Replay moves to capture FEN after each half-move
  const replay = new Chess(startingFen);
  const moves: PositionRecord[] = [];

  for (const move of verboseMoves) {
    replay.move(move.san);
    moves.push({
      fen: replay.fen(),
      san: move.san,
      from: move.from,
      to: move.to,
    });
  }

  const rawResult = headers.result;
  const result = rawResult && rawResult !== "*" ? rawResult : null;

  return {
    headers,
    moves,
    startingFen,
    result,
  };
}

/**
 * Check if a string is a Lichess game URL.
 */
export function isLichessGameUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      (url.hostname === "lichess.org" || url.hostname === "www.lichess.org") &&
      /^\/[a-zA-Z0-9]{8,12}(\/.*)?$/.test(url.pathname)
    );
  } catch {
    return false;
  }
}

/**
 * Extract the game ID from a Lichess URL.
 */
export function extractLichessGameId(url: string): string {
  const parsed = new URL(url);
  // Pathname is like /abcdefgh or /abcdefgh/black
  const segments = parsed.pathname.split("/").filter(Boolean);
  // The game ID is the first segment, potentially 8-12 chars
  const gameId = segments[0];
  // Lichess game IDs can be 8 chars (base) or 12 chars (with player suffix)
  // Truncate to 8 chars to get the base game ID
  return gameId.slice(0, 8);
}

/**
 * Fetch a PGN string from a Lichess game URL.
 */
export async function fetchLichessGamePGN(gameUrl: string): Promise<string> {
  if (!isLichessGameUrl(gameUrl)) {
    throw new Error("Invalid Lichess game URL");
  }

  const gameId = extractLichessGameId(gameUrl);
  const exportUrl = `https://lichess.org/game/export/${gameId}?clocks=false&evals=false`;

  const response = await fetch(exportUrl, {
    headers: { Accept: "application/x-chess-pgn" },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch game from Lichess (${response.status})`);
  }

  const pgn = await response.text();
  if (!pgn.trim()) {
    throw new Error("Empty PGN received from Lichess");
  }

  return pgn;
}
