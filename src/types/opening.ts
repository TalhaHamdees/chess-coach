import type { FEN, PieceColor } from "./chess";

/** ECO code, e.g. "C50", "D06" */
export type ECOCode = string;

/** Opening category by first move */
export type OpeningCategory = "e4" | "d4" | "other";

/** Difficulty level for an opening */
export type OpeningDifficulty = "beginner" | "intermediate" | "advanced";

/** A single move in an opening line */
export interface OpeningMove {
  /** 1-based move number */
  moveNumber: number;
  /** Standard algebraic notation, e.g. "e4", "Nf3" */
  san: string;
  /** Which color plays this move */
  color: PieceColor;
  /** Optional teaching note for this move */
  annotation?: string;
}

/** A named variation within an opening */
export interface OpeningVariation {
  /** Unique ID within the opening, e.g. "main-line", "exchange" */
  id: string;
  /** Display name, e.g. "Giuoco Piano" */
  name: string;
  /** Sequence of moves in this variation */
  moves: OpeningMove[];
  /** Board position after all moves are played */
  finalFen: FEN;
}

/** A complete opening with metadata and variations */
export interface Opening {
  /** URL-friendly ID, e.g. "italian-game" */
  id: string;
  /** Display name, e.g. "Italian Game" */
  name: string;
  /** ECO classification code */
  eco: ECOCode;
  /** Category by first move */
  category: OpeningCategory;
  /** Difficulty level */
  difficulty: OpeningDifficulty;
  /** 1-2 sentence description */
  description: string;
  /** Strategic bullet points for this opening */
  keyIdeas: string[];
  /** Which side the student plays */
  playerColor: PieceColor;
  /** FEN where the opening variations begin */
  startingFen: FEN;
  /** Named variations to study */
  variations: OpeningVariation[];
}
