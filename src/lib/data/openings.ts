import type {
  Opening,
  OpeningCategory,
  OpeningMove,
} from "@/types/opening";
import type { PieceColor } from "@/types/chess";

/** Helper to build alternating move sequences from SAN strings */
function buildMoves(
  sans: string[],
  startColor: PieceColor = "w"
): OpeningMove[] {
  let color: PieceColor = startColor;
  let moveNumber = 1;

  return sans.map((san) => {
    const move: OpeningMove = { moveNumber, san, color };
    if (color === "b") moveNumber++;
    color = color === "w" ? "b" : "w";
    return move;
  });
}

export const OPENINGS: Opening[] = [
  // ─── 1.e4 Openings ─────────────────────────────────────────────

  {
    id: "italian-game",
    name: "Italian Game",
    eco: "C50",
    category: "e4",
    difficulty: "beginner",
    description:
      "One of the oldest openings in chess. White develops the bishop to c4, targeting the f7 square and establishing central control.",
    keyIdeas: [
      "Rapid development of minor pieces",
      "Pressure on f7 through Bc4",
      "Strong pawn center with d4",
      "Quick castling for king safety",
    ],
    playerColor: "w",
    startingFen:
      "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    variations: [
      {
        id: "giuoco-piano",
        name: "Giuoco Piano",
        moves: buildMoves(["Bc5", "c3", "d6", "O-O", "Nf6", "d4"], "b"),
        finalFen:
          "r1bqk2r/ppp2ppp/2np1n2/2b1p3/2BPP3/2P2N2/PP3PPP/RNBQ1RK1 b kq - 0 6",
      },
      {
        id: "two-knights",
        name: "Two Knights Defense",
        moves: buildMoves(["Nf6", "d4", "exd4", "O-O", "Nxe4"], "b"),
        finalFen:
          "r1bqkb1r/pppp1ppp/2n5/8/2Bpn3/5N2/PPP2PPP/RNBQ1RK1 w kq - 0 6",
      },
      {
        id: "evans-gambit",
        name: "Evans Gambit",
        moves: buildMoves(
          ["Bc5", "b4", "Bxb4", "c3", "Ba5", "d4"],
          "b"
        ),
        finalFen:
          "r1bqk1nr/pppp1ppp/2n5/b3p3/2BPP3/2P2N2/P4PPP/RNBQK2R b KQkq - 0 6",
      },
    ],
  },

  {
    id: "ruy-lopez",
    name: "Ruy Lopez",
    eco: "C60",
    category: "e4",
    difficulty: "intermediate",
    description:
      "The 'Spanish Game' is one of the most deeply analyzed openings. White puts pressure on the e5 pawn by attacking the knight that defends it.",
    keyIdeas: [
      "Long-term pressure on Black's center",
      "Flexible pawn structure with many plans",
      "Typical maneuver Ba4-b3 to maintain tension",
      "Strong endgame prospects for White",
    ],
    playerColor: "w",
    startingFen:
      "r1bqkbnr/pppp1ppp/2n5/1B2p3/4P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    variations: [
      {
        id: "morphy-defense",
        name: "Morphy Defense",
        moves: buildMoves(["a6", "Ba4", "Nf6", "O-O", "Be7"], "b"),
        finalFen:
          "r1bqk2r/1pppbppp/p1n2n2/4p3/B3P3/5N2/PPPP1PPP/RNBQ1RK1 w kq - 4 6",
      },
      {
        id: "berlin-defense",
        name: "Berlin Defense",
        moves: buildMoves(["Nf6", "O-O", "Nxe4", "d4", "Nd6"], "b"),
        finalFen:
          "r1bqkb1r/pppp1ppp/2nn4/1B2p3/3P4/5N2/PPP2PPP/RNBQ1RK1 w kq - 1 6",
      },
      {
        id: "exchange-variation",
        name: "Exchange Variation",
        moves: buildMoves(["a6", "Bxc6", "dxc6", "O-O", "Bg4"], "b"),
        finalFen:
          "r2qkbnr/1pp2ppp/p1p5/4p3/4P1b1/5N2/PPPP1PPP/RNBQ1RK1 w kq - 2 6",
      },
    ],
  },

  {
    id: "scotch-game",
    name: "Scotch Game",
    eco: "C45",
    category: "e4",
    difficulty: "beginner",
    description:
      "White immediately challenges the center with 3.d4. A direct, tactical opening that leads to open positions with clear piece play.",
    keyIdeas: [
      "Immediate central confrontation",
      "Open lines for piece activity",
      "Knight on d4 controls key squares",
      "Active piece play over pawn structure",
    ],
    playerColor: "w",
    startingFen:
      "r1bqkbnr/pppp1ppp/2n5/4p3/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3",
    variations: [
      {
        id: "classical",
        name: "Classical Variation",
        moves: buildMoves(["exd4", "Nxd4", "Bc5", "Be3", "Qf6"], "b"),
        finalFen:
          "r1b1k1nr/pppp1ppp/2n2q2/2b5/3NP3/4B3/PPP2PPP/RN1QKB1R w KQkq - 3 6",
      },
      {
        id: "four-knights",
        name: "Scotch Four Knights",
        moves: buildMoves(["exd4", "Nxd4", "Nf6", "Nc3", "Bb4"], "b"),
        finalFen:
          "r1bqk2r/pppp1ppp/2n2n2/8/1b1NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 3 6",
      },
    ],
  },

  {
    id: "sicilian-defense",
    name: "Sicilian Defense",
    eco: "B20",
    category: "e4",
    difficulty: "intermediate",
    description:
      "The most popular response to 1.e4. Black fights for the center asymmetrically, creating imbalanced positions with chances for both sides.",
    keyIdeas: [
      "Asymmetric pawn structure creates imbalance",
      "Black gets the semi-open c-file",
      "White often attacks on the kingside",
      "Rich tactical and strategic possibilities",
    ],
    playerColor: "b",
    startingFen:
      "rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    variations: [
      {
        id: "najdorf",
        name: "Najdorf Variation",
        moves: buildMoves(["Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"], "w"),
        finalFen:
          "rnbqkb1r/1p2pppp/p2p1n2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
      },
      {
        id: "dragon",
        name: "Dragon Variation",
        moves: buildMoves(["Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "g6"], "w"),
        finalFen:
          "rnbqkb1r/pp2pp1p/3p1np1/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
      },
      {
        id: "scheveningen",
        name: "Scheveningen Variation",
        moves: buildMoves(["Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "e6"], "w"),
        finalFen:
          "rnbqkb1r/pp3ppp/3ppn2/8/3NP3/2N5/PPP2PPP/R1BQKB1R w KQkq - 0 6",
      },
    ],
  },

  {
    id: "french-defense",
    name: "French Defense",
    eco: "C00",
    category: "e4",
    difficulty: "intermediate",
    description:
      "A solid defense where Black challenges White's center with ...d5. Leads to strategic middlegames with clear pawn structures.",
    keyIdeas: [
      "Solid pawn chain e6-d5",
      "Counterplay with ...c5 against White's center",
      "Light-squared bishop often needs activation",
      "Typical pawn breaks: ...c5, ...f6",
    ],
    playerColor: "b",
    startingFen:
      "rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    variations: [
      {
        id: "advance",
        name: "Advance Variation",
        moves: buildMoves(["d4", "d5", "e5", "c5", "c3", "Nc6", "Nf3", "Qb6"], "w"),
        finalFen:
          "r1b1kbnr/pp3ppp/1qn1p3/2ppP3/3P4/2P2N2/PP3PPP/RNBQKB1R w KQkq - 3 6",
      },
      {
        id: "winawer",
        name: "Winawer Variation",
        moves: buildMoves(["d4", "d5", "Nc3", "Bb4", "e5", "c5", "a3", "Bxc3+", "bxc3"], "w"),
        finalFen:
          "rnbqk1nr/pp3ppp/4p3/2ppP3/3P4/P1P5/2P2PPP/R1BQKBNR b KQkq - 0 6",
      },
      {
        id: "classical",
        name: "Classical Variation",
        moves: buildMoves(["d4", "d5", "Nc3", "Nf6", "Bg5", "Be7", "e5", "Nfd7"], "w"),
        finalFen:
          "rnbqk2r/pppnbppp/4p3/3pP1B1/3P4/2N5/PPP2PPP/R2QKBNR w KQkq - 1 6",
      },
    ],
  },

  {
    id: "caro-kann",
    name: "Caro-Kann Defense",
    eco: "B10",
    category: "e4",
    difficulty: "beginner",
    description:
      "A solid, reliable defense. Black prepares ...d5 with the support of the c-pawn, keeping a sound pawn structure throughout.",
    keyIdeas: [
      "Solid pawn structure with no weaknesses",
      "Light-squared bishop develops outside the pawn chain",
      "Less space but fewer tactical risks",
      "Strong endgame potential for Black",
    ],
    playerColor: "b",
    startingFen:
      "rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2",
    variations: [
      {
        id: "classical",
        name: "Classical Variation",
        moves: buildMoves(
          ["d4", "d5", "Nc3", "dxe4", "Nxe4", "Bf5", "Ng3", "Bg6", "h4", "h6"],
          "w"
        ),
        finalFen:
          "rn1qkbnr/pp2ppp1/2p3bp/8/3P3P/6N1/PPP2PP1/R1BQKBNR w KQkq - 0 7",
      },
      {
        id: "advance",
        name: "Advance Variation",
        moves: buildMoves(["d4", "d5", "e5", "Bf5", "Nf3", "e6", "Be2", "c5"], "w"),
        finalFen:
          "rn1qkbnr/pp3ppp/4p3/2ppPb2/3P4/5N2/PPP1BPPP/RNBQK2R w KQkq - 0 6",
      },
    ],
  },

  // ─── 1.d4 Openings ─────────────────────────────────────────────

  {
    id: "queens-gambit",
    name: "Queen's Gambit",
    eco: "D06",
    category: "d4",
    difficulty: "beginner",
    description:
      "White offers a pawn to gain central control. Despite the name, it's not a true gambit as Black cannot hold the pawn safely.",
    keyIdeas: [
      "Central space advantage with pawns on d4 and c4",
      "Pressure on d5 forces Black to make structural decisions",
      "Queenside expansion potential",
      "Strong minor piece development",
    ],
    playerColor: "w",
    startingFen:
      "rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq - 0 2",
    variations: [
      {
        id: "accepted",
        name: "Queen's Gambit Accepted",
        moves: buildMoves(["dxc4", "Nf3", "Nf6", "e3", "e6", "Bxc4", "c5"], "b"),
        finalFen:
          "rnbqkb1r/pp3ppp/4pn2/2p5/2BP4/4PN2/PP3PPP/RNBQK2R w KQkq - 0 6",
      },
      {
        id: "classical",
        name: "Classical (Orthodox)",
        moves: buildMoves(
          ["e6", "Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3"],
          "b"
        ),
        finalFen:
          "rnbq1rk1/ppp1bppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R b KQ - 2 6",
      },
    ],
  },

  {
    id: "queens-gambit-declined",
    name: "Queen's Gambit Declined",
    eco: "D30",
    category: "d4",
    difficulty: "intermediate",
    description:
      "Black declines the gambit with ...e6, maintaining a solid center. One of the most classical and respected defenses in chess.",
    keyIdeas: [
      "Solid central pawn duo on d5 and e6",
      "Development behind the pawn chain",
      "Typical minority attack for White on queenside",
      "Strategic battle over the c-file",
    ],
    playerColor: "b",
    startingFen:
      "rnbqkbnr/ppp2ppp/4p3/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    variations: [
      {
        id: "orthodox",
        name: "Orthodox Defense",
        moves: buildMoves(
          ["Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "Nbd7"],
          "w"
        ),
        finalFen:
          "r1bq1rk1/pppnbppp/4pn2/3p2B1/2PP4/2N1PN2/PP3PPP/R2QKB1R w KQ - 3 7",
      },
      {
        id: "tartakower",
        name: "Tartakower Variation",
        moves: buildMoves(
          ["Nc3", "Nf6", "Bg5", "Be7", "e3", "O-O", "Nf3", "h6", "Bh4", "b6"],
          "w"
        ),
        finalFen:
          "rnbq1rk1/p1p1bpp1/1p2pn1p/3p4/2PP3B/2N1PN2/PP3PPP/R2QKB1R w KQ - 0 8",
      },
    ],
  },

  {
    id: "london-system",
    name: "London System",
    eco: "D00",
    category: "d4",
    difficulty: "beginner",
    description:
      "A solid, systematic opening for White. Easy to learn with a clear development scheme: Bf4, e3, Nf3, c3 — works against almost anything.",
    keyIdeas: [
      "Simple, consistent development plan",
      "Bishop to f4 before e3 locks it in",
      "Solid pawn triangle: d4-e3-c3",
      "Works against virtually any Black setup",
    ],
    playerColor: "w",
    startingFen:
      "rnbqkbnr/ppp1pppp/8/3p4/3P1B2/8/PPP1PPPP/RN1QKBNR b KQkq - 1 2",
    variations: [
      {
        id: "main-line",
        name: "Main Line",
        moves: buildMoves(
          ["Nf6", "e3", "e6", "Nf3", "c5", "c3", "Nc6", "Nbd2"],
          "b"
        ),
        finalFen:
          "r1bqkb1r/pp3ppp/2n1pn2/2pp4/3P1B2/2P1PN2/PP1N1PPP/R2QKB1R b KQkq - 2 6",
      },
      {
        id: "jobava",
        name: "Jobava London",
        moves: buildMoves(["Nf6", "Nc3", "e6", "e3", "Bd6", "Bg3", "O-O"], "b"),
        finalFen:
          "rnbq1rk1/ppp2ppp/3bpn2/3p4/3P4/2N1P1B1/PPP2PPP/R2QKBNR w KQ - 3 6",
      },
    ],
  },

  {
    id: "kings-indian-defense",
    name: "King's Indian Defense",
    eco: "E60",
    category: "d4",
    difficulty: "advanced",
    description:
      "An aggressive hypermodern defense where Black allows White to build a big center, then counterattacks it. Leads to sharp, complex middlegames.",
    keyIdeas: [
      "Fianchetto bishop on g7 exerts long-range pressure",
      "Counterattack with ...e5 or ...c5",
      "Kingside attack potential with ...f5",
      "Rich tactical complications in the middlegame",
    ],
    playerColor: "b",
    startingFen:
      "rnbqkb1r/pppppp1p/5np1/8/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    variations: [
      {
        id: "classical",
        name: "Classical Variation",
        moves: buildMoves(
          ["Nc3", "Bg7", "e4", "d6", "Nf3", "O-O", "Be2", "e5"],
          "w"
        ),
        finalFen:
          "rnbq1rk1/ppp2pbp/3p1np1/4p3/2PPP3/2N2N2/PP2BPPP/R1BQK2R w KQ - 0 7",
      },
      {
        id: "saemisch",
        name: "Saemisch Variation",
        moves: buildMoves(
          ["Nc3", "Bg7", "e4", "d6", "f3", "O-O", "Be3", "e5"],
          "w"
        ),
        finalFen:
          "rnbq1rk1/ppp2pbp/3p1np1/4p3/2PPP3/2N1BP2/PP4PP/R2QKBNR w KQ - 0 7",
      },
    ],
  },

  {
    id: "slav-defense",
    name: "Slav Defense",
    eco: "D10",
    category: "d4",
    difficulty: "intermediate",
    description:
      "Black supports d5 with ...c6 instead of ...e6, keeping the light-squared bishop free. A rock-solid defense favored at the highest levels.",
    keyIdeas: [
      "Solid support of d5 without blocking the bishop",
      "Light-squared bishop can develop to f5 or g4",
      "Sturdy pawn structure resistant to attack",
      "Clear plans for both sides in the middlegame",
    ],
    playerColor: "b",
    startingFen:
      "rnbqkbnr/pp2pppp/2p5/3p4/2PP4/8/PP2PPPP/RNBQKBNR w KQkq - 0 3",
    variations: [
      {
        id: "main-line",
        name: "Main Line",
        moves: buildMoves(
          ["Nf3", "Nf6", "Nc3", "dxc4", "a4", "Bf5", "e3", "e6"],
          "w"
        ),
        finalFen:
          "rn1qkb1r/pp3ppp/2p1pn2/5b2/P1pP4/2N1PN2/1P3PPP/R1BQKB1R w KQkq - 0 7",
      },
      {
        id: "exchange",
        name: "Exchange Variation",
        moves: buildMoves(
          ["cxd5", "cxd5", "Nc3", "Nf6", "Bf4", "Nc6", "e3"],
          "w"
        ),
        finalFen:
          "r1bqkb1r/pp2pppp/2n2n2/3p4/3P1B2/2N1P3/PP3PPP/R2QKBNR b KQkq - 0 6",
      },
    ],
  },

  // ─── Other Openings ─────────────────────────────────────────────

  {
    id: "english-opening",
    name: "English Opening",
    eco: "A10",
    category: "other",
    difficulty: "intermediate",
    description:
      "A flexible flank opening where White controls d5 with the c-pawn. Can transpose into many other openings or lead to unique positions.",
    keyIdeas: [
      "Flexible — can transpose into 1.d4 systems",
      "Control d5 from the flank",
      "Often features a kingside fianchetto",
      "Positional, maneuvering middlegames",
    ],
    playerColor: "w",
    startingFen:
      "rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq - 0 1",
    variations: [
      {
        id: "reversed-sicilian",
        name: "Reversed Sicilian",
        moves: buildMoves(
          ["e5", "Nc3", "Nf6", "Nf3", "Nc6", "g3", "d5", "cxd5", "Nxd5"],
          "b"
        ),
        finalFen:
          "r1bqkb1r/ppp2ppp/2n5/3np3/8/2N2NP1/PP1PPP1P/R1BQKB1R w KQkq - 0 6",
      },
      {
        id: "symmetrical",
        name: "Symmetrical Variation",
        moves: buildMoves(
          ["c5", "Nc3", "Nc6", "g3", "g6", "Bg2", "Bg7", "Nf3", "Nf6"],
          "b"
        ),
        finalFen:
          "r1bqk2r/pp1pppbp/2n2np1/2p5/2P5/2N2NP1/PP1PPPBP/R1BQK2R w KQkq - 4 6",
      },
    ],
  },
];

/** Look up an opening by its URL-friendly ID */
export function getOpeningById(id: string): Opening | undefined {
  return OPENINGS.find((o) => o.id === id);
}

/** Get all openings in a given category */
export function getOpeningsByCategory(category: OpeningCategory): Opening[] {
  return OPENINGS.filter((o) => o.category === category);
}

/** Get all distinct opening categories */
export function getOpeningCategories(): OpeningCategory[] {
  return [...new Set(OPENINGS.map((o) => o.category))];
}
