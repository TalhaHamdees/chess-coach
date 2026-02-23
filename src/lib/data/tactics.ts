import type {
  TacticsPuzzle,
  PuzzleMove,
  TacticsTheme,
  PuzzleDifficulty,
} from "@/types/tactics";
import type { PieceColor } from "@/types/chess";

/** Helper to build alternating move sequences from SAN strings */
function buildSolution(
  sans: string[],
  startColor: PieceColor,
  annotations?: (string | undefined)[]
): PuzzleMove[] {
  let color: PieceColor = startColor;
  return sans.map((san, i) => {
    const move: PuzzleMove = { san, color };
    if (annotations?.[i]) {
      move.annotation = annotations[i];
    }
    const prev = color;
    color = color === "w" ? "b" : "w";
    return { ...move, color: prev };
  });
}

export const TACTICS_PUZZLES: TacticsPuzzle[] = [
  // ─── Mate in 1 ────────────────────────────────────────────────
  {
    id: "back-rank-1",
    name: "Back Rank Mate",
    theme: "back-rank",
    difficulty: "beginner",
    description: "White to move and deliver checkmate on the back rank.",
    playerColor: "w",
    fen: "6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1",
    solution: buildSolution(["Re8#"], "w", [
      "The rook slides to the 8th rank. The pawns on f7, g7, h7 block the king's escape — checkmate!",
    ]),
    hints: [
      "Look at Black's back rank — is the king trapped?",
      "The pawns block the king from escaping.",
    ],
  },

  {
    id: "mate-in-1-queen",
    name: "Queen Mate on 8th",
    theme: "mate-in-1",
    difficulty: "beginner",
    description: "White to move and deliver checkmate with the queen.",
    playerColor: "w",
    fen: "5rk1/5p1p/8/8/8/8/5PPP/4Q1K1 w - - 0 1",
    solution: buildSolution(["Qe8"], "w", [
      "The queen invades the 8th rank. The rook is pinned and cannot capture — checkmate!",
    ]),
    hints: [
      "Black's f8-rook is pinned or overloaded.",
      "Can the queen reach the 8th rank safely?",
    ],
  },

  {
    id: "mate-in-1-knight",
    name: "Smothered-Style Knight Mate",
    theme: "mate-in-1",
    difficulty: "beginner",
    description: "White to move and checkmate with the knight.",
    playerColor: "w",
    fen: "6k1/5ppp/6N1/8/8/8/8/6K1 w - - 0 1",
    solution: buildSolution(["Nf8"], "w", [
      "The knight delivers check from f8 and the king's own pawns block every escape — a smothered-style mate!",
    ]),
    hints: [
      "The black king is boxed in by its own pawns.",
      "Knights can jump to squares other pieces can't reach.",
    ],
  },

  // ─── Forks ────────────────────────────────────────────────────
  {
    id: "knight-fork-1",
    name: "Royal Knight Fork",
    theme: "fork",
    difficulty: "beginner",
    description: "White's knight can fork the king and a major piece. Find the fork!",
    playerColor: "w",
    fen: "r2q1rk1/ppp2ppp/2n5/3pN3/3P4/4P3/PPP2PPP/R2QK2R w KQ - 0 1",
    solution: buildSolution(["Nc6"], "w", [
      "The knight lands on c6, simultaneously attacking the queen on d8 and the rook on a8!",
    ]),
    hints: [
      "Look at what the knight on e5 can attack in one jump.",
      "Can the knight attack two pieces at once?",
    ],
  },

  {
    id: "pawn-fork-1",
    name: "Pawn Fork",
    theme: "fork",
    difficulty: "beginner",
    description: "White can push a pawn to fork two pieces. Find the move!",
    playerColor: "w",
    fen: "rnbqkbnr/pppp1ppp/8/8/3Pp3/2N5/PPP2PPP/R1BQKBNR w KQkq - 0 3",
    solution: buildSolution(["d5"], "w", [
      "The pawn advances to d5, forking the knight on c6 (if it retreated there) or attacking the center while the e4 pawn is hanging.",
    ]),
    hints: [
      "A pawn can attack two squares at once.",
      "Push the d-pawn forward — what does it attack?",
    ],
  },

  // ─── Pins ─────────────────────────────────────────────────────
  {
    id: "pin-1",
    name: "Bishop Pin Wins Material",
    theme: "pin",
    difficulty: "intermediate",
    description: "White exploits a pin-like tactic to win material. Find the combination!",
    playerColor: "w",
    fen: "r1bqkb1r/pppp1ppp/2n5/4p2n/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 4",
    solution: buildSolution(
      ["Bxf7+", "Ke7", "Bb3"],
      "w",
      [
        "Sacrifice on f7 with check! The king is forced to move.",
        "The king steps to e7, losing castling rights.",
        "The bishop retreats safely with an extra pawn and a weakened enemy king.",
      ]
    ),
    hints: [
      "Look at the f7 square — it's only defended by the king.",
      "A check can force the king to give something up.",
    ],
  },

  // ─── Discovered Attacks ───────────────────────────────────────
  {
    id: "discovery-1",
    name: "Discovered Check",
    theme: "discovery",
    difficulty: "intermediate",
    description: "White can use a discovered check to win material.",
    playerColor: "w",
    fen: "rnbqkb1r/ppp1pppp/8/3pN3/3Pn3/8/PPP2PPP/RNBQKB1R w KQkq - 0 1",
    solution: buildSolution(["Bb5+"], "w", [
      "The bishop moves to b5 with check! This is a discovered attack — the knight on e5 was blocking the bishop's diagonal. Now Black must deal with the check while the knight threatens other pieces.",
    ]),
    hints: [
      "Which piece is blocking a powerful line?",
      "Moving one piece can reveal an attack by another.",
    ],
  },

  // ─── Skewers ──────────────────────────────────────────────────
  {
    id: "skewer-1",
    name: "Rook Skewer",
    theme: "skewer",
    difficulty: "intermediate",
    description: "White can skewer the king to win the rook. Find the skewer!",
    playerColor: "w",
    fen: "r4k2/8/8/8/8/8/8/4R1K1 w - - 0 1",
    solution: buildSolution(
      ["Re8+", "Kf7", "Rxa8"],
      "w",
      [
        "Check! The king and rook are aligned on the 8th rank.",
        "The king steps away from the rook.",
        "The rook captures the now-unprotected rook on a8!",
      ]
    ),
    hints: [
      "A skewer attacks a valuable piece, forcing it to move and exposing a piece behind it.",
      "Can you give check along the 8th rank?",
    ],
  },

  // ─── Deflection ───────────────────────────────────────────────
  {
    id: "deflection-1",
    name: "Deflection Exchange",
    theme: "deflection",
    difficulty: "intermediate",
    description: "White deflects a key defender to break through. Find the winning sequence!",
    playerColor: "w",
    fen: "2kr3r/ppp2ppp/2n5/8/8/8/PPP2PPP/1K1RR3 w - - 0 1",
    solution: buildSolution(
      ["Rxd8+", "Rxd8", "Re8"],
      "w",
      [
        "Exchange the d8-rook with check!",
        "Black is forced to recapture.",
        "Now the second rook invades the 8th rank — Black's remaining rook is pinned or lost!",
      ]
    ),
    hints: [
      "Black's rooks are defending each other. Can you break the connection?",
      "An exchange with check gains a tempo.",
    ],
  },

  // ─── Trapped Pieces ───────────────────────────────────────────
  {
    id: "trapped-1",
    name: "Trapped Bishop",
    theme: "trapped-piece",
    difficulty: "beginner",
    description: "White can trap the bishop. Find the move!",
    playerColor: "w",
    fen: "rnbqk1nr/pppppppp/8/2b5/4P3/3P4/PPP2PPP/RNBQKBNR w KQkq - 0 1",
    solution: buildSolution(["d4"], "w", [
      "The pawn advance to d4 attacks the bishop on c5 and restricts its retreat squares. The bishop has fewer safe squares now.",
    ]),
    hints: [
      "The bishop on c5 looks active, but can you restrict it?",
      "Push a pawn to attack and limit the bishop's options.",
    ],
  },

  // ─── Zwischenzug ──────────────────────────────────────────────
  {
    id: "zwischen-1",
    name: "Zwischenzug (In-Between Move)",
    theme: "zwischenzug",
    difficulty: "advanced",
    description: "Instead of the expected recapture, White plays an in-between move first.",
    playerColor: "w",
    fen: "r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 4",
    solution: buildSolution(
      ["Bxf7+", "Ke7"],
      "w",
      [
        "Instead of a normal developing move, White inserts this check! The king is forced to respond.",
        "The king loses castling rights and is exposed in the center — White has gained a significant advantage.",
      ]
    ),
    hints: [
      "Before making the obvious move, is there an in-between check available?",
      "An intermediate move with check can change everything.",
    ],
  },

  // ─── Greek Gift ───────────────────────────────────────────────
  {
    id: "greek-gift-1",
    name: "Greek Gift Sacrifice",
    theme: "discovery",
    secondaryThemes: ["mate-in-3"],
    difficulty: "advanced",
    description: "The classic bishop sacrifice on h7. Set up a devastating attack!",
    playerColor: "w",
    fen: "r1bq1rk1/pppn1ppp/4pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 1",
    solution: buildSolution(["Bxh7+"], "w", [
      "The classic Greek Gift! Sacrificing the bishop on h7 rips open the king's shelter. After Kxh7, Ng5+ leads to a devastating attack with Qh5.",
    ]),
    hints: [
      "Look at the classic attacking pattern: bishop sacrifice on h7.",
      "After Bxh7+ Kxh7, which knight move creates a double attack?",
    ],
  },
];

/** Look up a puzzle by ID */
export function getPuzzleById(id: string): TacticsPuzzle | undefined {
  return TACTICS_PUZZLES.find((p) => p.id === id);
}

/** Get all puzzles for a given theme */
export function getPuzzlesByTheme(theme: TacticsTheme): TacticsPuzzle[] {
  return TACTICS_PUZZLES.filter(
    (p) => p.theme === theme || p.secondaryThemes?.includes(theme)
  );
}

/** Get all puzzles for a given difficulty */
export function getPuzzlesByDifficulty(
  difficulty: PuzzleDifficulty
): TacticsPuzzle[] {
  return TACTICS_PUZZLES.filter((p) => p.difficulty === difficulty);
}

/** Get all distinct themes present in the catalog */
export function getTacticsThemes(): TacticsTheme[] {
  const themes = new Set<TacticsTheme>();
  for (const p of TACTICS_PUZZLES) {
    themes.add(p.theme);
    p.secondaryThemes?.forEach((t) => themes.add(t));
  }
  return [...themes];
}
