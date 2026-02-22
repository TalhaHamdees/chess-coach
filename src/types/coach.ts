import type { Arrow, FEN } from "./chess";

/** Move quality assessment from the AI coach */
export type MoveQuality =
  | "brilliant"
  | "good"
  | "inaccuracy"
  | "mistake"
  | "blunder";

/** Structured response from the AI coach */
export interface CoachResponse {
  message: string;
  fen: FEN | null;
  arrows: Arrow[];
  highlights: string[];
  engineMove: string | null;
  suggestedMove: string | null;
  moveQuality: MoveQuality | null;
}

/** Coaching mode determines system prompt behavior */
export type CoachingMode =
  | "free-play"
  | "opening-trainer"
  | "tactics"
  | "endgame"
  | "analysis"
  | "planning";

/** A single message in the coach chat */
export interface ChatMessage {
  id: string;
  role: "coach" | "student";
  content: string;
  timestamp: number;
  coachResponse?: CoachResponse;
}

/** Request payload sent to the coach API route */
export interface CoachRequest {
  message: string;
  fen: FEN;
  moveHistory: string[];
  mode: CoachingMode;
  chatHistory: Pick<ChatMessage, "role" | "content">[];
}
