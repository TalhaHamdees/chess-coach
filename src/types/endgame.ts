import type { FEN, PieceColor } from "./chess";

/** Endgame category */
export type EndgameCategory =
  | "king-pawn"
  | "king-rook"
  | "king-queen"
  | "king-bishop"
  | "king-knight"
  | "rook-endgame"
  | "pawn-endgame"
  | "queen-endgame";

/** Difficulty level for an endgame position */
export type EndgameDifficulty = "beginner" | "intermediate" | "advanced";

/** A single solution move in an endgame exercise */
export interface EndgameMove {
  /** Standard algebraic notation */
  san: string;
  /** Which color plays this move */
  color: PieceColor;
  /** Teaching note explaining the technique */
  annotation?: string;
}

/** An endgame training position */
export interface EndgamePosition {
  /** Unique position ID */
  id: string;
  /** Display name, e.g. "King + Rook vs King" */
  name: string;
  /** Endgame category */
  category: EndgameCategory;
  /** Difficulty level */
  difficulty: EndgameDifficulty;
  /** Description of the technique or goal */
  description: string;
  /** Key teaching points for this endgame */
  keyTechniques: string[];
  /** Which side the student plays */
  playerColor: PieceColor;
  /** Starting FEN position */
  fen: FEN;
  /** Solution move sequence demonstrating the technique */
  solution: EndgameMove[];
  /** Hint text shown before revealing moves */
  hints: string[];
}
