import type {
  EndgamePosition,
  EndgameMove,
  EndgameCategory,
  EndgameDifficulty,
} from "@/types/endgame";
import type { PieceColor } from "@/types/chess";

/** Helper to build alternating move sequences from SAN strings */
function buildSolution(
  sans: string[],
  startColor: PieceColor,
  annotations?: (string | undefined)[]
): EndgameMove[] {
  let color: PieceColor = startColor;
  return sans.map((san, i) => {
    const move: EndgameMove = { san, color };
    if (annotations?.[i]) {
      move.annotation = annotations[i];
    }
    const prev = color;
    color = color === "w" ? "b" : "w";
    return { ...move, color: prev };
  });
}

export const ENDGAME_POSITIONS: EndgamePosition[] = [
  // ─── King + Rook vs King ──────────────────────────────────────
  {
    id: "kr-vs-k-1",
    name: "King + Rook vs King",
    category: "king-rook",
    difficulty: "beginner",
    description:
      "Learn the box (rectangle) method to force checkmate with a king and rook against a lone king.",
    keyTechniques: [
      "Use the rook to cut off the enemy king to a smaller area",
      "Bring your king closer to support the rook",
      "Give checks to push the enemy king to the edge",
      "Checkmate happens on the edge of the board",
    ],
    playerColor: "w",
    fen: "8/8/4k3/8/8/8/8/R3K3 w - - 0 1",
    solution: buildSolution(
      ["Ra6+", "Kd5", "Ke2", "Ke5", "Ke3", "Kd5", "Ra5+", "Kd6", "Kd4"],
      "w",
      [
        "Check! The rook cuts off the king on the 6th rank.",
        undefined,
        "Bring the king closer to support the rook.",
        undefined,
        "Keep advancing the king.",
        undefined,
        "Check again! Push the king further back.",
        undefined,
        "The king advances to support the final mating net.",
      ]
    ),
    hints: [
      "Use the rook to restrict the enemy king's movement area.",
      "The rook should check along ranks to push the king back.",
    ],
  },

  // ─── King + Queen vs King ─────────────────────────────────────
  {
    id: "kq-vs-k-1",
    name: "King + Queen vs King",
    category: "king-queen",
    difficulty: "beginner",
    description:
      "Drive the enemy king to the edge of the board with queen and king coordination. Be careful not to stalemate!",
    keyTechniques: [
      "Use the queen to restrict the enemy king's movement",
      "Keep your queen a knight's distance from the enemy king",
      "Bring your king close for the final checkmate",
      "Watch out for stalemate — always leave an escape square until the end",
    ],
    playerColor: "w",
    fen: "8/8/4k3/8/8/4K3/8/7Q w - - 0 1",
    solution: buildSolution(
      ["Qd1", "Kf5", "Qd5+", "Kf6", "Kf4"],
      "w",
      [
        "Centralize the queen to control more squares.",
        undefined,
        "Check! Drive the king toward the edge.",
        undefined,
        "Advance the king to support the queen for the final checkmate.",
      ]
    ),
    hints: [
      "Don't rush to give checks — first restrict the enemy king.",
      "Keep the queen at a safe distance to avoid stalemate.",
    ],
  },

  // ─── King + Pawn vs King ──────────────────────────────────────
  {
    id: "kp-vs-k-1",
    name: "King + Pawn vs King: Key Squares",
    category: "king-pawn",
    difficulty: "beginner",
    description:
      "Learn the fundamental concept of key squares — the king must reach certain squares ahead of the pawn to ensure promotion.",
    keyTechniques: [
      "The key squares are two ranks ahead of the pawn",
      "If the king reaches a key square, the pawn promotes by force",
      "Opposition (kings facing each other, one square apart) is critical",
      "The king should advance BEFORE the pawn when possible",
    ],
    playerColor: "w",
    fen: "8/8/4k3/8/4P3/4K3/8/8 w - - 0 1",
    solution: buildSolution(
      ["Kf4", "Kd6", "e5+", "Ke6", "Ke4"],
      "w",
      [
        "Step the king forward! The king must lead the pawn.",
        undefined,
        "Now push the pawn with check to gain a tempo.",
        undefined,
        "Take the opposition — both kings face each other and White has the advantage.",
      ]
    ),
    hints: [
      "The king should advance BEFORE pushing the pawn.",
      "Try to gain the opposition (kings facing each other with one square between).",
    ],
  },

  // ─── Opposition ───────────────────────────────────────────────
  {
    id: "opposition-1",
    name: "Direct Opposition",
    category: "pawn-endgame",
    difficulty: "beginner",
    description:
      "Master the concept of opposition — when kings face each other with one square between them, the side NOT to move has the opposition and can force the other king aside.",
    keyTechniques: [
      "Opposition: kings on same file/rank with one square between them",
      "The side NOT to move 'has the opposition'",
      "Having the opposition means the opponent must give way",
      "Use opposition to escort passed pawns to promotion",
    ],
    playerColor: "w",
    fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1",
    solution: buildSolution(
      ["Kd6", "Kd8", "e6", "Ke8", "e7"],
      "w",
      [
        "Take the opposition! The black king must give way.",
        undefined,
        "Now push the pawn forward.",
        undefined,
        "The pawn advances to the 7th rank. The king cannot stop promotion.",
      ]
    ),
    hints: [
      "Take the opposition by placing your king directly facing the enemy king.",
      "Once you have the opposition, the pawn can advance safely.",
    ],
  },

  // ─── Lucena Position ──────────────────────────────────────────
  {
    id: "lucena-1",
    name: "Lucena Position: Building a Bridge",
    category: "rook-endgame",
    difficulty: "intermediate",
    description:
      "The most important rook endgame position. Learn the 'bridge-building' technique to promote a pawn when your king shelters on the 8th rank.",
    keyTechniques: [
      "Move the rook to the 4th rank to build a bridge",
      "The rook shields the king from checks by interposing on the 4th rank",
      "The king steps out and the pawn promotes",
      "This technique works regardless of where the defending rook is",
    ],
    playerColor: "w",
    fen: "3K4/3P1k2/8/8/8/8/8/3r3R w - - 0 1",
    solution: buildSolution(
      ["Rh4", "Rd2", "Kc7", "Rc2+", "Kb6", "Rb2+", "Ka5", "Ra2+", "Kb4"],
      "w",
      [
        "The key move! Place the rook on the 4th rank to build a bridge.",
        undefined,
        "Step the king out to let the pawn promote.",
        undefined,
        "Keep moving the king away from the checks.",
        undefined,
        "One more step...",
        undefined,
        "The king reaches b4, blocking the rook's checks. The rook on h4 will interpose on the next check, and the pawn promotes!",
      ]
    ),
    hints: [
      "The rook needs to reach the 4th rank to block future checks.",
      "Think about 'building a bridge' for the king to cross.",
    ],
  },

  // ─── Philidor Position ────────────────────────────────────────
  {
    id: "philidor-1",
    name: "Philidor Position: Defensive Technique",
    category: "rook-endgame",
    difficulty: "intermediate",
    description:
      "The key defensive rook endgame. Learn how to draw by keeping the rook on the 3rd rank and then switching to checks from behind.",
    keyTechniques: [
      "Keep the rook on the 3rd rank to prevent the enemy king from advancing",
      "Once the pawn advances to the 6th rank, switch to checks from behind",
      "The defending king stays on the back rank opposite the pawn",
      "Infinite rook checks from a distance guarantee the draw",
    ],
    playerColor: "w",
    fen: "8/3k4/8/3PK3/8/8/8/3r3R w - - 0 1",
    solution: buildSolution(
      ["Rh7+", "Kd8", "Rh8+", "Kd7", "Rh1"],
      "w",
      [
        "Check from behind! Force the king away.",
        undefined,
        "Keep checking!",
        undefined,
        "Return the rook to the 1st rank, ready for more checks. This demonstrates the checking technique from behind the pawn.",
      ]
    ),
    hints: [
      "Rook checks from behind are very effective against a pawn on the 5th/6th rank.",
      "Keep maximum distance between your rook and the enemy king.",
    ],
  },

  // ─── Two Connected Pawns ──────────────────────────────────────
  {
    id: "kpp-vs-k-1",
    name: "Two Connected Pawns vs King",
    category: "pawn-endgame",
    difficulty: "beginner",
    description:
      "Two connected passed pawns, supported by the king, are a powerful force. Learn to coordinate their advance.",
    keyTechniques: [
      "Connected pawns protect each other as they advance",
      "The king should support from behind",
      "Advance the pawns together — don't rush one too far ahead",
      "Two connected pawns on the 6th rank beat a rook!",
    ],
    playerColor: "w",
    fen: "8/8/8/8/2k5/8/2PP4/2K5 w - - 0 1",
    solution: buildSolution(
      ["d3", "Kd4", "Kd2", "Kc5", "Ke3"],
      "w",
      [
        "Advance one pawn, keeping them connected.",
        undefined,
        "Bring the king up to support the advance.",
        undefined,
        "The king steps forward. The pawns will advance together with king support.",
      ]
    ),
    hints: [
      "Keep the pawns side by side — they protect each other.",
      "The king should advance to support the pawns, not stay behind.",
    ],
  },

  // ─── King + Bishop + Knight vs King ───────────────────────────
  {
    id: "kbn-vs-k-1",
    name: "K+B+N vs K: Corner Technique",
    category: "king-bishop",
    difficulty: "advanced",
    description:
      "The most difficult basic checkmate. You must drive the king to a corner of the bishop's color. This exercise shows the key setup moves.",
    keyTechniques: [
      "Checkmate only works in corners matching the bishop's color",
      "Use the knight and bishop together to restrict the king",
      "The W-maneuver with the knight is key to driving the king",
      "This mate can take up to 33 moves — patience is essential",
    ],
    playerColor: "w",
    fen: "k7/8/1K6/8/8/5B2/8/6N1 w - - 0 1",
    solution: buildSolution(
      ["Bd5", "Kb8", "Ne2"],
      "w",
      [
        "Centralize the bishop to control key diagonals.",
        undefined,
        "Reposition the knight to help create a mating net.",
      ]
    ),
    hints: [
      "The bishop must control the corner's color for checkmate to work.",
      "Start by centralizing your pieces before trying to force the king.",
    ],
  },

  // ─── Active Rook ──────────────────────────────────────────────
  {
    id: "rook-active-1",
    name: "Active Rook Behind Passed Pawn",
    category: "rook-endgame",
    difficulty: "intermediate",
    description:
      "A rook is most powerful behind a passed pawn — whether attacking or defending. Place the rook behind the pawn and use the king actively.",
    keyTechniques: [
      "A rook behind a passed pawn gains strength as the pawn advances",
      "The defending rook should also be behind passed pawns when possible",
      "Rook activity is often more important than material",
      "Combine pawn advance with king activity",
    ],
    playerColor: "w",
    fen: "8/p4kpp/8/1P6/8/6K1/8/R7 w - - 0 1",
    solution: buildSolution(
      ["Ra5", "Ke6", "b6", "axb6", "Rb5"],
      "w",
      [
        "Place the rook behind the passed pawn — it gains power as the pawn advances.",
        undefined,
        "Push the pawn!",
        undefined,
        "The rook recaptures, maintaining an active position on the b-file.",
      ]
    ),
    hints: [
      "Where should a rook be positioned relative to a passed pawn?",
      "The rook is most effective BEHIND the passed pawn.",
    ],
  },

  // ─── Queen vs Pawn ────────────────────────────────────────────
  {
    id: "queen-vs-pawn-1",
    name: "Pawn Promotion Race",
    category: "queen-endgame",
    difficulty: "intermediate",
    description:
      "White's pawn can promote immediately. In queen vs pawn races, timing is everything — can you promote first?",
    keyTechniques: [
      "Calculate the pawn race precisely — count the moves",
      "A queen beats a pawn in most endings",
      "When promoting, consider underpromotion if stalemate is possible",
      "A pawn on the 7th rank with king support is very dangerous",
    ],
    playerColor: "w",
    fen: "8/1P6/8/8/8/7q/5k2/3K4 w - - 0 1",
    solution: buildSolution(["b8=Q"], "w", [
      "Promote immediately! The new queen gives White a decisive material advantage. Now it's a queen vs queen battle where White has the initiative.",
    ]),
    hints: [
      "When you can promote, don't hesitate!",
      "Count the moves — can your pawn promote safely?",
    ],
  },

  // ─── Pawn Race ────────────────────────────────────────────────
  {
    id: "pawn-race-1",
    name: "Pawn Race with King Support",
    category: "pawn-endgame",
    difficulty: "advanced",
    description:
      "Both sides have passed pawns racing to promote. White must use king support to win the race.",
    keyTechniques: [
      "Count moves to promotion for both sides",
      "The king can help by blocking the opponent's pawn",
      "Queening with check can be decisive",
      "After both sides queen, the side that queens first often wins",
    ],
    playerColor: "w",
    fen: "8/p7/8/8/8/8/7P/K6k w - - 0 1",
    solution: buildSolution(
      ["h4", "a5", "h5", "a4", "h6", "a3", "h7", "a2+", "Kb2"],
      "w",
      [
        "Start pushing!",
        undefined,
        "Keep racing.",
        undefined,
        "The h-pawn is faster...",
        undefined,
        "Almost there!",
        undefined,
        "Step the king aside. White will promote with tempo after Black promotes.",
      ]
    ),
    hints: [
      "Both pawns are racing — who promotes first?",
      "Count the moves carefully for each pawn.",
    ],
  },

  // ─── King Activity ────────────────────────────────────────────
  {
    id: "king-activity-1",
    name: "King Activity in Pawn Endgames",
    category: "pawn-endgame",
    difficulty: "beginner",
    description:
      "In pawn endgames, the king becomes a powerful piece. Activate it by marching toward the center and the opponent's weaknesses.",
    keyTechniques: [
      "The king is a strong piece in the endgame — use it!",
      "Centralize the king before the opponent can",
      "An active king can support pawn breaks and attack weaknesses",
      "In king and pawn endings, tempi are critical",
    ],
    playerColor: "w",
    fen: "8/5pk1/5p2/8/3K4/8/8/8 w - - 0 1",
    solution: buildSolution(
      ["Ke4", "Kg6", "Kf4"],
      "w",
      [
        "Advance the king toward the center and the enemy pawns.",
        undefined,
        "Continue advancing. The king aims to attack the f-pawns from the front.",
      ]
    ),
    hints: [
      "In the endgame, the king should march toward the action.",
      "Centralize your king — it's your strongest piece in a pawn ending!",
    ],
  },
];

/** Look up an endgame position by ID */
export function getEndgameById(id: string): EndgamePosition | undefined {
  return ENDGAME_POSITIONS.find((e) => e.id === id);
}

/** Get all positions for a given category */
export function getEndgamesByCategory(
  category: EndgameCategory
): EndgamePosition[] {
  return ENDGAME_POSITIONS.filter((e) => e.category === category);
}

/** Get all positions for a given difficulty */
export function getEndgamesByDifficulty(
  difficulty: EndgameDifficulty
): EndgamePosition[] {
  return ENDGAME_POSITIONS.filter((e) => e.difficulty === difficulty);
}

/** Get all distinct categories present in the catalog */
export function getEndgameCategories(): EndgameCategory[] {
  return [...new Set(ENDGAME_POSITIONS.map((e) => e.category))];
}
