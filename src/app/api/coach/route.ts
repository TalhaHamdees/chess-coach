import { NextRequest, NextResponse } from "next/server";
import { sendCoachMessage } from "@/lib/ai/coach";
import { validateFEN } from "@/lib/chess/engine";
import type { CoachRequest, CoachingMode } from "@/types/coach";

const VALID_MODES: CoachingMode[] = [
  "free-play",
  "opening-trainer",
  "tactics",
  "endgame",
  "analysis",
  "planning",
];

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI coaching is not configured. Missing API key." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  const { message, fen, mode, moveHistory, chatHistory } =
    body as Record<string, unknown>;

  // Validate message
  if (typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json(
      { error: "Message is required and must be a non-empty string." },
      { status: 400 }
    );
  }

  // Validate FEN
  if (typeof fen !== "string") {
    return NextResponse.json(
      { error: "FEN is required and must be a string." },
      { status: 400 }
    );
  }
  const fenResult = validateFEN(fen);
  if (!fenResult.ok) {
    return NextResponse.json(
      { error: `Invalid FEN: ${fenResult.error}` },
      { status: 400 }
    );
  }

  // Validate mode
  if (!VALID_MODES.includes(mode as CoachingMode)) {
    return NextResponse.json(
      { error: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate optional arrays
  if (moveHistory !== undefined && !Array.isArray(moveHistory)) {
    return NextResponse.json(
      { error: "moveHistory must be an array." },
      { status: 400 }
    );
  }
  if (chatHistory !== undefined && !Array.isArray(chatHistory)) {
    return NextResponse.json(
      { error: "chatHistory must be an array." },
      { status: 400 }
    );
  }

  const coachRequest: CoachRequest = {
    message: message.trim(),
    fen: fen as string,
    mode: mode as CoachingMode,
    moveHistory: Array.isArray(moveHistory) ? moveHistory : [],
    chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
  };

  try {
    const response = await sendCoachMessage(coachRequest, apiKey);
    return NextResponse.json(response);
  } catch (error: unknown) {
    // Check for rate limiting
    if (
      error instanceof Error &&
      (error.message.includes("rate") || error.message.includes("429"))
    ) {
      return NextResponse.json(
        { error: "Rate limited. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    console.error("Coach API error:", error);
    return NextResponse.json(
      { error: "An error occurred while processing your request." },
      { status: 500 }
    );
  }
}
