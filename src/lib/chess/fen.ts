import type { FEN, Square, Piece, PieceColor, PieceType } from "@/types/chess";

/**
 * Map of square → piece for board setup mode.
 * Used instead of FEN when the position may be incomplete (e.g. missing kings).
 */
export type BoardMap = Map<Square, Piece>;

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["8", "7", "6", "5", "4", "3", "2", "1"];

const PIECE_CHARS: Record<string, { color: PieceColor; type: PieceType }> = {
  K: { color: "w", type: "k" },
  Q: { color: "w", type: "q" },
  R: { color: "w", type: "r" },
  B: { color: "w", type: "b" },
  N: { color: "w", type: "n" },
  P: { color: "w", type: "p" },
  k: { color: "b", type: "k" },
  q: { color: "b", type: "q" },
  r: { color: "b", type: "r" },
  b: { color: "b", type: "b" },
  n: { color: "b", type: "n" },
  p: { color: "b", type: "p" },
};

function pieceToChar(piece: Piece): string {
  const ch = piece.type === "n" ? "n" : piece.type;
  return piece.color === "w" ? ch.toUpperCase() : ch;
}

/**
 * Parse the placement field of a FEN string into a BoardMap.
 * Only reads the first field (piece placement) — ignores turn, castling, etc.
 */
export function fenToBoardMap(fen: FEN): BoardMap {
  const placement = fen.split(" ")[0];
  const map: BoardMap = new Map();
  const rows = placement.split("/");

  for (let rankIdx = 0; rankIdx < rows.length && rankIdx < 8; rankIdx++) {
    const row = rows[rankIdx];
    let fileIdx = 0;
    for (const ch of row) {
      if (fileIdx >= 8) break;
      const digit = parseInt(ch, 10);
      if (!isNaN(digit)) {
        fileIdx += digit;
      } else {
        const piece = PIECE_CHARS[ch];
        if (piece) {
          const square = `${FILES[fileIdx]}${RANKS[rankIdx]}`;
          map.set(square, { type: piece.type, color: piece.color });
        }
        fileIdx++;
      }
    }
  }

  return map;
}

interface BoardMapToFenOptions {
  turn?: PieceColor;
  castling?: string;
  enPassant?: string;
  halfmove?: number;
  fullmove?: number;
}

/**
 * Build a FEN string from a BoardMap.
 * Pure string manipulation — no chess.js dependency.
 */
export function boardMapToFen(map: BoardMap, options?: BoardMapToFenOptions): FEN {
  const turn = options?.turn ?? "w";
  const castling = options?.castling ?? "-";
  const enPassant = options?.enPassant ?? "-";
  const halfmove = options?.halfmove ?? 0;
  const fullmove = options?.fullmove ?? 1;

  const rows: string[] = [];

  for (const rank of RANKS) {
    let row = "";
    let empty = 0;

    for (const file of FILES) {
      const square = `${file}${rank}`;
      const piece = map.get(square);
      if (piece) {
        if (empty > 0) {
          row += empty.toString();
          empty = 0;
        }
        row += pieceToChar(piece);
      } else {
        empty++;
      }
    }

    if (empty > 0) {
      row += empty.toString();
    }
    rows.push(row);
  }

  return `${rows.join("/")} ${turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a BoardMap for playability.
 * Checks that both kings are present and basic piece count limits.
 */
export function isValidSetupPosition(map: BoardMap): ValidationResult {
  let whiteKing = 0;
  let blackKing = 0;
  let whitePawns = 0;
  let blackPawns = 0;

  for (const [square, piece] of map) {
    if (piece.type === "k") {
      if (piece.color === "w") whiteKing++;
      else blackKing++;
    }
    if (piece.type === "p") {
      if (piece.color === "w") whitePawns++;
      else blackPawns++;
      // Pawns can't be on rank 1 or 8
      const rank = square[1];
      if (rank === "1" || rank === "8") {
        return { valid: false, error: "Pawns cannot be on the first or eighth rank" };
      }
    }
  }

  if (whiteKing === 0) {
    return { valid: false, error: "White king is missing" };
  }
  if (blackKing === 0) {
    return { valid: false, error: "Black king is missing" };
  }
  if (whiteKing > 1) {
    return { valid: false, error: "Too many white kings" };
  }
  if (blackKing > 1) {
    return { valid: false, error: "Too many black kings" };
  }
  if (whitePawns > 8) {
    return { valid: false, error: "Too many white pawns" };
  }
  if (blackPawns > 8) {
    return { valid: false, error: "Too many black pawns" };
  }

  return { valid: true };
}

/** Empty board map (no pieces). */
export const EMPTY_BOARD_MAP: BoardMap = new Map();

/** Starting position board map. */
export const START_BOARD_MAP: BoardMap = fenToBoardMap(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
);
