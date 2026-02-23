import type { CoachingMode } from "@/types/coach";
import type { GameHeaders } from "@/types/chess";

export const BASE_SYSTEM_PROMPT = `You are a friendly, encouraging chess coach. Your job is to help the student improve at chess through clear explanations and visual guidance.

IMPORTANT: You must ALWAYS respond with valid JSON matching this exact schema:

{
  "message": "Your explanation text here",
  "fen": null,
  "arrows": [],
  "highlights": [],
  "engineMove": null,
  "suggestedMove": null,
  "moveQuality": null
}

Field rules:
- "message" (string, required): Your coaching explanation. Use clear, concise language.
- "fen" (string | null): A new board position in FEN notation, or null to keep the current position.
- "arrows" (array): Visual arrows on the board. Each arrow: { "from": "e2", "to": "e4", "color": "green" }
  Arrow colors and their meanings:
  - "green" = good move / recommended
  - "red" = bad move / danger / threat
  - "blue" = alternative option
  - "yellow" = key square to watch
  - "orange" = opponent's threat
  When providing multiple arrows, reference them by number in your message text (e.g., "Arrow 1 shows the best move, while Arrow 2 is a solid alternative"). The board displays numbered labels on arrows when there are 2 or more, so this helps the student connect your explanation to the visual.
- "highlights" (array of strings): Squares to highlight, e.g. ["e4", "d5"]
- "engineMove" (string | null): The engine's best move in "e2-e4" format, or null.
- "suggestedMove" (string | null): A hint move for the student in "e2-e4" format, or null.
- "moveQuality" (string | null): Rate the student's last move as one of: "brilliant", "good", "inaccuracy", "mistake", "blunder", or null if not applicable.

IMPORTANT: Before stating whether a move is legal or suggesting a move, carefully verify the piece exists on the expected square and that no pieces block its path. Use the provided FEN to check the actual board state. Never guess — if unsure, say so.

CRITICAL: Return ONLY the JSON object. No markdown, no code fences, no extra text outside the JSON.`;

export const MODE_PROMPTS: Record<CoachingMode, string> = {
  "free-play": `You are in free play mode. The student is playing casually and may ask for advice, analysis, or general chess guidance at any point. Be helpful but not overbearing — let them explore and only give deep analysis when asked. Use arrows liberally to illustrate ideas — show the best move in green, alternatives in blue, and threats in orange or red. When showing multiple options, reference them by number so the student can match your explanation to the arrows on the board.`,

  "opening-trainer": `You are in opening trainer mode. Focus on teaching opening principles, specific opening lines, and the ideas behind moves. Explain pawn structures, piece development plans, and common mistakes in the opening. When the student plays a move, evaluate it in the context of opening theory.`,

  "tactics": `You are in tactics trainer mode. Focus on tactical patterns: forks, pins, skewers, discovered attacks, back rank mates, and combinations. When presenting puzzles, give hints before revealing the answer. Use arrows to show tactical motifs.`,

  "endgame": `You are in endgame trainer mode. Focus on endgame technique: king activity, pawn promotion, opposition, zugzwang, and basic checkmate patterns. Explain the key principles that govern the specific type of endgame on the board.`,

  "analysis": `You are in analysis mode. Provide deep, objective analysis of the current position. Evaluate material balance, pawn structure, king safety, piece activity, and space. Suggest candidate moves with variations and explain the trade-offs.`,

  "planning": `You are in planning mode. Help the student create a study plan to improve their chess rating. Ask about their current level, weaknesses, and goals. Suggest specific areas to focus on and exercises to practice.`,
};

export function buildSystemPrompt(mode: CoachingMode): string {
  return `${BASE_SYSTEM_PROMPT}\n\n${MODE_PROMPTS[mode]}`;
}

/**
 * Build context string for the opening trainer mode.
 * Sent as the first automated message to give the coach opening-specific knowledge.
 */
export function buildOpeningTrainerContext(opening: {
  name: string;
  eco: string;
  keyIdeas: string[];
  playerColor: "w" | "b";
}): string {
  const color = opening.playerColor === "w" ? "White" : "Black";
  const ideas = opening.keyIdeas.map((idea) => `- ${idea}`).join("\n");

  return [
    `The student is studying the ${opening.name} (${opening.eco}).`,
    `They are playing as ${color}.`,
    "",
    "Key ideas for this opening:",
    ideas,
    "",
    "Please introduce this opening and guide the student through the main ideas. Use arrows and highlights to illustrate key squares and plans.",
  ].join("\n");
}

/**
 * Build context string for the tactics trainer mode.
 * Sent as the first automated message to give the coach puzzle-specific knowledge.
 */
export function buildTacticsTrainerContext(puzzle: {
  name: string;
  theme: string;
  description: string;
  playerColor: "w" | "b";
}): string {
  const color = puzzle.playerColor === "w" ? "White" : "Black";
  return [
    `The student is solving a tactics puzzle: "${puzzle.name}".`,
    `Theme: ${puzzle.theme}. ${puzzle.description}`,
    `They are playing as ${color}.`,
    "",
    "Guide them toward finding the tactical idea. Give hints if they struggle, but don't reveal the solution directly. Use arrows to highlight tactical patterns.",
  ].join("\n");
}

/**
 * Build context string for the endgame trainer mode.
 * Sent as the first automated message to give the coach endgame-specific knowledge.
 */
export function buildEndgameTrainerContext(position: {
  name: string;
  category: string;
  description: string;
  keyTechniques: string[];
  playerColor: "w" | "b";
}): string {
  const color = position.playerColor === "w" ? "White" : "Black";
  const techniques = position.keyTechniques.map((t) => `- ${t}`).join("\n");
  return [
    `The student is studying an endgame: "${position.name}" (${position.category}).`,
    `They are playing as ${color}.`,
    position.description,
    "",
    "Key techniques:",
    techniques,
    "",
    "Guide them through the correct technique. Explain the reasoning behind each move. Use arrows to highlight key squares and plans.",
  ].join("\n");
}

/**
 * Build context string for the rating improvement planner.
 * Formats user-submitted form data for the planning AI mode.
 */
export function buildPlannerContext(data: {
  currentRating: number;
  targetRating: number;
  studyTime: string;
  weaknesses: string[];
  timeControl: string;
  solvedTactics?: number;
  streakDays?: number;
}): string {
  const lines: string[] = [
    `The student wants to improve from rating ${data.currentRating} to ${data.targetRating}.`,
    `Available study time: ${data.studyTime} per week.`,
    `Preferred time control: ${data.timeControl}.`,
  ];

  if (data.weaknesses.length > 0) {
    lines.push(`Self-identified weaknesses: ${data.weaknesses.join(", ")}.`);
  }

  if (data.solvedTactics && data.solvedTactics > 0) {
    lines.push(`They have solved ${data.solvedTactics} tactics puzzles on this platform.`);
  }

  if (data.streakDays && data.streakDays > 0) {
    lines.push(`Current practice streak: ${data.streakDays} day(s).`);
  }

  lines.push("");
  lines.push("Create a structured weekly study plan with milestones. Recommend specific training modules available on this platform: Opening Trainer, Tactics Trainer, Endgame Trainer, and Game Analysis.");

  return lines.join("\n");
}

/**
 * Build context string for the game analysis mode.
 * Sent as the first automated message when a game is loaded for review.
 */
export function buildAnalysisContext(game: {
  headers: GameHeaders;
  currentMoveIndex: number;
  totalMoves: number;
  lastMoveSan?: string;
}): string {
  const lines: string[] = [];

  const { headers, currentMoveIndex, totalMoves, lastMoveSan } = game;

  // Game info
  if (headers.white || headers.black) {
    const whiteName = headers.white ?? "Unknown";
    const blackName = headers.black ?? "Unknown";
    const whiteElo = headers.whiteElo ? ` (${headers.whiteElo})` : "";
    const blackElo = headers.blackElo ? ` (${headers.blackElo})` : "";
    lines.push(`Game: ${whiteName}${whiteElo} vs ${blackName}${blackElo}`);
  }

  if (headers.event) {
    lines.push(`Event: ${headers.event}`);
  }

  if (headers.result) {
    lines.push(`Result: ${headers.result}`);
  }

  if (currentMoveIndex >= 0 && lastMoveSan) {
    const moveNum = Math.floor(currentMoveIndex / 2) + 1;
    const dots = currentMoveIndex % 2 === 0 ? "." : "...";
    lines.push(`Currently viewing: move ${moveNum}${dots} ${lastMoveSan} (move ${currentMoveIndex + 1} of ${totalMoves})`);
  } else {
    lines.push(`Game has ${totalMoves} half-moves total.`);
  }

  lines.push("");
  lines.push("I've loaded a game for analysis. Please provide an overview of this game and highlight the key moments. Use arrows and highlights to illustrate important ideas.");

  return lines.join("\n");
}
