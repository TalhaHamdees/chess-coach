import { create } from "zustand";
import { Chess } from "chess.js";
import {
  createGame,
  makeMove,
  getValidMoves,
  getFEN,
  getGameStatus,
} from "@/lib/chess/engine";
import type { FEN, Square, Arrow, SquareHighlight, ChessMove, GameStatus } from "@/types/chess";
import { DEFAULT_POSITION } from "@/lib/chess/engine";

interface GameState {
  /** Current chess.js game instance */
  game: Chess;
  /** Current FEN string */
  fen: FEN;
  /** Move history as SAN strings */
  moveHistory: string[];
  /** Currently selected square */
  selectedSquare: Square | null;
  /** Valid move targets for selected piece */
  validMoveTargets: Square[];
  /** Arrows drawn on the board */
  arrows: Arrow[];
  /** Highlighted squares */
  highlights: SquareHighlight[];
  /** Whether the board is flipped (black at bottom) */
  flipped: boolean;
  /** Current game status */
  status: GameStatus;
  /** Last move from/to for highlighting */
  lastMove: { from: Square; to: Square } | null;
}

interface GameActions {
  /** Select a square (piece selection for click-to-move) */
  selectSquare: (square: Square) => void;
  /** Attempt to make a move */
  move: (move: ChessMove) => boolean;
  /** Reset to starting position or a specific FEN */
  reset: (fen?: FEN) => void;
  /** Toggle board flip */
  flipBoard: () => void;
  /** Set arrows on the board */
  setArrows: (arrows: Arrow[]) => void;
  /** Set highlighted squares */
  setHighlights: (highlights: SquareHighlight[]) => void;
  /** Clear selection */
  clearSelection: () => void;
}

export type GameStore = GameState & GameActions;

function buildInitialState(fen?: FEN): GameState {
  const game = createGame(fen);
  return {
    game,
    fen: getFEN(game),
    moveHistory: [],
    selectedSquare: null,
    validMoveTargets: [],
    arrows: [],
    highlights: [],
    flipped: false,
    status: getGameStatus(game),
    lastMove: null,
  };
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...buildInitialState(),

  selectSquare: (square: Square) => {
    const { game, selectedSquare, validMoveTargets, status } = get();

    // If game is over, don't allow selection
    if (status.isGameOver) return;

    // If clicking a valid move target, make the move
    if (selectedSquare && validMoveTargets.includes(square)) {
      get().move({ from: selectedSquare, to: square });
      return;
    }

    // Clear coach arrows/highlights on any board interaction
    const clearCoach = { arrows: [] as Arrow[], highlights: [] as SquareHighlight[] };

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      set({ selectedSquare: null, validMoveTargets: [], ...clearCoach });
      return;
    }

    // Try to select a piece on this square
    const moves = getValidMoves(game, square);
    if (moves.length > 0) {
      set({
        selectedSquare: square,
        validMoveTargets: moves.map((m) => m.to),
        ...clearCoach,
      });
    } else {
      // Clicked empty square or opponent piece with no selection — clear
      set({ selectedSquare: null, validMoveTargets: [], ...clearCoach });
    }
  },

  move: (moveInput: ChessMove) => {
    const { game } = get();
    const { game: newGame, result } = makeMove(game, moveInput);

    if (!result.success) return false;

    set({
      game: newGame,
      fen: result.fen,
      moveHistory: [...get().moveHistory, result.san],
      selectedSquare: null,
      validMoveTargets: [],
      status: getGameStatus(newGame),
      lastMove: { from: moveInput.from, to: moveInput.to },
      arrows: [],
      highlights: [],
    });

    return true;
  },

  reset: (fen?: FEN) => {
    set(buildInitialState(fen));
  },

  flipBoard: () => {
    set({ flipped: !get().flipped });
  },

  setArrows: (arrows: Arrow[]) => {
    set({ arrows });
  },

  setHighlights: (highlights: SquareHighlight[]) => {
    set({ highlights });
  },

  clearSelection: () => {
    set({ selectedSquare: null, validMoveTargets: [] });
  },
}));
