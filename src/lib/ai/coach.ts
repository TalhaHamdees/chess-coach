import Anthropic from "@anthropic-ai/sdk";
import type { CoachRequest, CoachResponse } from "@/types/coach";
import { buildSystemPrompt } from "./prompts";
import { parseCoachResponse } from "./parser";
import { validateCoachMoves } from "./move-validator";

export async function sendCoachMessage(
  request: CoachRequest,
  apiKey: string
): Promise<CoachResponse> {
  const client = new Anthropic({ apiKey });

  const systemPrompt = buildSystemPrompt(request.mode);

  // Build message history from chat history
  const messages: Array<{ role: "user" | "assistant"; content: string }> =
    request.chatHistory.map((msg) => ({
      role: msg.role === "student" ? "user" : "assistant",
      content: msg.content,
    }));

  // Add current message with board context
  const userMessage = `Current position (FEN): ${request.fen}
Move history: ${request.moveHistory.length > 0 ? request.moveHistory.join(", ") : "none"}

Student: ${request.message}`;

  messages.push({ role: "user", content: userMessage });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  // Extract text from response
  const textBlock = response.content.find((block) => block.type === "text");
  const rawText = textBlock ? textBlock.text : "";

  const parsed = parseCoachResponse(rawText);
  return validateCoachMoves(parsed, request.fen);
}
