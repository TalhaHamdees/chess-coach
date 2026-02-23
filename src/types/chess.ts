/** Algebraic notation square, e.g. "e4", "d7" */
export type Square = string;

/** Move in from-to format, e.g. "e2-e4" */
export interface ChessMove {
  from: Square;
  to: Square;
  promotion?: "q" | "r" | "b" | "n";
}

/** FEN string representing a board position */
export type FEN = string;

/** Arrow drawn on the board */
export interface Arrow {
  from: Square;
  to: Square;
  color: ArrowColor;
}

/** Arrow color meanings: green=good, red=bad, blue=alternative, yellow=key, orange=threat */
export type ArrowColor = "green" | "red" | "blue" | "yellow" | "orange";

/** Square highlight on the board */
export interface SquareHighlight {
  square: Square;
  color: ArrowColor;
}

/** Piece color */
export type PieceColor = "w" | "b";

/** Piece type */
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

/** A piece on the board */
export interface Piece {
  type: PieceType;
  color: PieceColor;
}

/** Result of a move validation/execution */
export interface MoveResult {
  success: boolean;
  fen: FEN;
  san: string;
  captured?: PieceType;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
}

/** Game status */
export interface GameStatus {
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  isGameOver: boolean;
  turn: PieceColor;
}

/** PGN game headers */
export interface GameHeaders {
  white?: string;
  black?: string;
  date?: string;
  event?: string;
  result?: string;
  eco?: string;
  whiteElo?: string;
  blackElo?: string;
  [key: string]: string | undefined;
}

/** A single position record from a parsed game */
export interface PositionRecord {
  fen: FEN;
  san: string;
  from: Square;
  to: Square;
}

/** A fully parsed PGN game */
export interface ParsedGame {
  headers: GameHeaders;
  moves: PositionRecord[];
  startingFen: FEN;
  result: string | null;
}
