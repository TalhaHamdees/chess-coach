import type { CoachResponse, MoveQuality } from "@/types/coach";
import type { ArrowColor, Arrow } from "@/types/chess";
import { validateFEN } from "@/lib/chess/engine";

const VALID_ARROW_COLORS: ArrowColor[] = [
  "green",
  "red",
  "blue",
  "yellow",
  "orange",
];

const VALID_MOVE_QUALITIES: MoveQuality[] = [
  "brilliant",
  "good",
  "inaccuracy",
  "mistake",
  "blunder",
];

const SQUARE_REGEX = /^[a-h][1-8]$/;

function createFallback(message: string): CoachResponse {
  return {
    message,
    fen: null,
    arrows: [],
    highlights: [],
    engineMove: null,
    suggestedMove: null,
    moveQuality: null,
  };
}

function stripCodeFences(raw: string): string {
  let text = raw.trim();
  // Remove ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
  }
  return text;
}

function isValidArrow(arrow: unknown): arrow is Arrow {
  if (typeof arrow !== "object" || arrow === null) return false;
  const a = arrow as Record<string, unknown>;
  return (
    typeof a.from === "string" &&
    SQUARE_REGEX.test(a.from) &&
    typeof a.to === "string" &&
    SQUARE_REGEX.test(a.to) &&
    typeof a.color === "string" &&
    VALID_ARROW_COLORS.includes(a.color as ArrowColor)
  );
}

function isValidSquare(square: unknown): square is string {
  return typeof square === "string" && SQUARE_REGEX.test(square);
}

function isValidMoveString(move: unknown): move is string {
  if (typeof move !== "string") return false;
  const parts = move.split("-");
  return parts.length === 2 && SQUARE_REGEX.test(parts[0]) && SQUARE_REGEX.test(parts[1]);
}

export function parseCoachResponse(raw: string): CoachResponse {
  if (!raw || raw.trim().length === 0) {
    return createFallback("");
  }

  const stripped = stripCodeFences(raw);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    return createFallback(raw.trim());
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return createFallback(raw.trim());
  }

  // Extract and validate message
  const message =
    typeof parsed.message === "string" ? parsed.message : raw.trim();

  // Extract and validate FEN
  let fen: string | null = null;
  if (typeof parsed.fen === "string" && parsed.fen.length > 0) {
    const fenResult = validateFEN(parsed.fen);
    if (fenResult.ok) {
      fen = parsed.fen;
    }
  }

  // Extract and validate arrows
  let arrows: Arrow[] = [];
  if (Array.isArray(parsed.arrows)) {
    arrows = parsed.arrows.filter(isValidArrow);
  }

  // Extract and validate highlights
  let highlights: string[] = [];
  if (Array.isArray(parsed.highlights)) {
    highlights = parsed.highlights.filter(isValidSquare);
  }

  // Extract and validate engineMove
  let engineMove: string | null = null;
  if (isValidMoveString(parsed.engineMove)) {
    engineMove = parsed.engineMove;
  }

  // Extract and validate suggestedMove
  let suggestedMove: string | null = null;
  if (isValidMoveString(parsed.suggestedMove)) {
    suggestedMove = parsed.suggestedMove;
  }

  // Extract and validate moveQuality
  let moveQuality: MoveQuality | null = null;
  if (
    typeof parsed.moveQuality === "string" &&
    VALID_MOVE_QUALITIES.includes(parsed.moveQuality as MoveQuality)
  ) {
    moveQuality = parsed.moveQuality as MoveQuality;
  }

  return {
    message,
    fen,
    arrows,
    highlights,
    engineMove,
    suggestedMove,
    moveQuality,
  };
}
