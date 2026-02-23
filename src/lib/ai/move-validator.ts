import type { CoachResponse } from "@/types/coach";
import type { FEN } from "@/types/chess";
import { createGame, getValidMoves } from "@/lib/chess/engine";

/**
 * SAN regex patterns for extracting chess move references from text.
 * Ordered from most specific to least specific to avoid false positives.
 */

// Castling: O-O or O-O-O (with optional check/mate)
const CASTLING_REGEX = /\bO-O(?:-O)?[+#]?\b/g;

// Piece moves: Nf3, Bxe5, Rad1, Qh4+, Nge2, R1a3, etc.
const PIECE_MOVE_REGEX =
  /\b([KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?)\b/g;

// Pawn captures: exd5, axb4, fxg1=Q+
const PAWN_CAPTURE_REGEX = /\b([a-h]x[a-h][1-8](?:=[QRBN])?[+#]?)\b/g;

// Pawn pushes: e4, d5, e8=Q — only match when surrounded by chess context
const PAWN_PUSH_REGEX = /\b([a-h][1-8](?:=[QRBN])?[+#]?)\b/g;

/** Words that indicate chess context nearby */
const CHESS_CONTEXT_WORDS =
  /\b(move|play|push|capture|takes?|check|castle|pawn|piece|bishop|knight|rook|queen|king|square|diagonal|file|rank|opening|variation|gambit|defense|attack|threat|pin|fork|develop|advance|retreat|sacrifice|exchange|recapture|fianchetto)\b/i;

/**
 * Extract all SAN move tokens from a text message.
 * Returns deduplicated list of candidate SAN strings.
 */
export function extractSANTokens(message: string): string[] {
  const tokens = new Set<string>();

  // Castling
  for (const match of message.matchAll(CASTLING_REGEX)) {
    tokens.add(match[0]);
  }

  // Piece moves (high confidence — these are almost always chess moves)
  for (const match of message.matchAll(PIECE_MOVE_REGEX)) {
    tokens.add(match[1]);
  }

  // Pawn captures (high confidence)
  for (const match of message.matchAll(PAWN_CAPTURE_REGEX)) {
    tokens.add(match[1]);
  }

  // Pawn pushes (lower confidence — "e4" could be a grid reference)
  // Only include if there's chess context in the message
  if (CHESS_CONTEXT_WORDS.test(message)) {
    for (const match of message.matchAll(PAWN_PUSH_REGEX)) {
      tokens.add(match[1]);
    }
  }

  return [...tokens];
}

/**
 * Check if a "from-to" format move (e.g., "e2-e4") is legal in the given position.
 */
function isFromToMoveLegal(
  moveStr: string,
  legalMoves: { from: string; to: string; san: string }[]
): boolean {
  const parts = moveStr.split("-");
  if (parts.length !== 2) return false;
  const [from, to] = parts;
  return legalMoves.some((m) => m.from === from && m.to === to);
}

/**
 * Check if a SAN move token is legal in the given position.
 * Strips check/mate suffixes before comparing.
 */
function isSANMoveLegal(san: string, legalSANs: string[]): boolean {
  // Strip check/mate suffixes for comparison since game.moves() includes them contextually
  const stripped = san.replace(/[+#]$/, "");
  return legalSANs.some((legal) => legal.replace(/[+#]$/, "") === stripped);
}

/**
 * Validate and correct AI coach move references against the actual board position.
 *
 * 1. Nulls out engineMove/suggestedMove if they're illegal
 * 2. Scans message text for illegal SAN references and appends a correction note
 */
export function validateCoachMoves(
  response: CoachResponse,
  fen: FEN
): CoachResponse {
  let game;
  try {
    game = createGame(fen);
  } catch {
    // If FEN is invalid, we can't validate — return as-is
    return response;
  }

  const legalMoves = getValidMoves(game);
  const legalSANs = legalMoves.map((m) => m.san);

  // Validate engineMove
  const engineMove =
    response.engineMove && isFromToMoveLegal(response.engineMove, legalMoves)
      ? response.engineMove
      : null;

  // Validate suggestedMove
  const suggestedMove =
    response.suggestedMove &&
    isFromToMoveLegal(response.suggestedMove, legalMoves)
      ? response.suggestedMove
      : null;

  // Scan message for illegal SAN references
  const sanTokens = extractSANTokens(response.message);
  const illegalMoves = sanTokens.filter(
    (san) => !isSANMoveLegal(san, legalSANs)
  );

  let message = response.message;
  if (illegalMoves.length > 0) {
    const moveList = illegalMoves.map((m) => `"${m}"`).join(", ");
    const plural = illegalMoves.length > 1;
    const legalAlt =
      legalSANs.length > 0
        ? ` Legal moves include: ${legalSANs.slice(0, 5).join(", ")}.`
        : "";
    message += `\n\n**Correction:** ${plural ? "The moves" : "The move"} ${moveList} ${plural ? "are" : "is"} not legal in this position.${legalAlt}`;
  }

  return {
    ...response,
    message,
    engineMove,
    suggestedMove,
  };
}
