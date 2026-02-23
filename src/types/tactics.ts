import type { FEN, PieceColor } from "./chess";

/** Tactical theme categories */
export type TacticsTheme =
  | "fork"
  | "pin"
  | "skewer"
  | "discovery"
  | "back-rank"
  | "deflection"
  | "decoy"
  | "mate-in-1"
  | "mate-in-2"
  | "mate-in-3"
  | "trapped-piece"
  | "overloaded-piece"
  | "zwischenzug";

/** Difficulty level for a puzzle */
export type PuzzleDifficulty = "beginner" | "intermediate" | "advanced";

/** A single solution move in a tactics puzzle */
export interface PuzzleMove {
  /** Standard algebraic notation, e.g. "Qxf7+" */
  san: string;
  /** Which color plays this move */
  color: PieceColor;
  /** Optional teaching note shown after this move */
  annotation?: string;
}

/** A tactics puzzle */
export interface TacticsPuzzle {
  /** Unique puzzle ID */
  id: string;
  /** Display name, e.g. "Knight Fork on f7" */
  name: string;
  /** Primary tactical theme */
  theme: TacticsTheme;
  /** Additional themes present in the puzzle */
  secondaryThemes?: TacticsTheme[];
  /** Difficulty level */
  difficulty: PuzzleDifficulty;
  /** Short description of what to find */
  description: string;
  /** Which side the student plays */
  playerColor: PieceColor;
  /** Starting FEN position */
  fen: FEN;
  /** Solution move sequence (player + opponent responses) */
  solution: PuzzleMove[];
  /** Hint text shown before revealing answer */
  hints: string[];
}
