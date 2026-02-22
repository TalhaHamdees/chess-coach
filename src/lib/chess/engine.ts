import { Chess, validateFen, DEFAULT_POSITION } from "chess.js";
import type {
  FEN,
  Square,
  ChessMove,
  MoveResult,
  GameStatus,
  Piece,
} from "@/types/chess";

export { DEFAULT_POSITION };

/**
 * Create a new Chess instance from a FEN string or starting position.
 */
export function createGame(fen?: FEN): Chess {
  if (fen) {
    const validation = validateFen(fen);
    if (!validation.ok) {
      throw new Error(`Invalid FEN: ${validation.error}`);
    }
  }
  return new Chess(fen);
}

/**
 * Make a move on a game instance. Returns a new game + move result.
 * Does NOT mutate the original game.
 */
export function makeMove(
  game: Chess,
  move: ChessMove
): { game: Chess; result: MoveResult } {
  const clone = createGame(game.fen());
  try {
    const result = clone.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion,
    });
    return {
      game: clone,
      result: {
        success: true,
        fen: clone.fen(),
        san: result.san,
        captured: result.captured as MoveResult["captured"],
        isCheck: clone.isCheck(),
        isCheckmate: clone.isCheckmate(),
        isDraw: clone.isDraw(),
        isStalemate: clone.isStalemate(),
      },
    };
  } catch {
    return {
      game,
      result: {
        success: false,
        fen: game.fen(),
        san: "",
        isCheck: false,
        isCheckmate: false,
        isDraw: false,
        isStalemate: false,
      },
    };
  }
}

/**
 * Get all valid moves for a position, optionally filtered by square.
 */
export function getValidMoves(
  game: Chess,
  square?: Square
): { from: Square; to: Square; san: string }[] {
  const options = square
    ? { square: square as Parameters<Chess["moves"]>[0] extends infer T
        ? T extends { square: infer S } ? S : never : never,
        verbose: true as const }
    : { verbose: true as const };

  const moves = game.moves(options);
  return (moves as Array<{ from: string; to: string; san: string }>).map(
    (m) => ({
      from: m.from,
      to: m.to,
      san: m.san,
    })
  );
}

/**
 * Check if the current side is in check.
 */
export function isCheck(game: Chess): boolean {
  return game.isCheck();
}

/**
 * Check if the current position is checkmate.
 */
export function isCheckmate(game: Chess): boolean {
  return game.isCheckmate();
}

/**
 * Get the full game status.
 */
export function getGameStatus(game: Chess): GameStatus {
  return {
    isCheck: game.isCheck(),
    isCheckmate: game.isCheckmate(),
    isDraw: game.isDraw(),
    isStalemate: game.isStalemate(),
    isGameOver: game.isGameOver(),
    turn: game.turn() as "w" | "b",
  };
}

/**
 * Parse a FEN string and return it if valid, or throw.
 */
export function parseFEN(fen: string): FEN {
  const validation = validateFen(fen);
  if (!validation.ok) {
    throw new Error(`Invalid FEN: ${validation.error}`);
  }
  return fen;
}

/**
 * Validate a FEN string. Returns { ok, error? }.
 */
export function validateFEN(fen: string): { ok: boolean; error?: string } {
  const result = validateFen(fen);
  return { ok: result.ok, error: result.error };
}

/**
 * Get piece at a specific square.
 */
export function getPiece(game: Chess, square: Square): Piece | null {
  const piece = game.get(square as Parameters<Chess["get"]>[0]);
  if (!piece) return null;
  return { type: piece.type, color: piece.color };
}

/**
 * Get the move history as SAN strings.
 */
export function getMoveHistory(game: Chess): string[] {
  return game.history();
}

/**
 * Get the current FEN from a game.
 */
export function getFEN(game: Chess): FEN {
  return game.fen();
}
