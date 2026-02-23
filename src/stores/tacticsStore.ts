import { create } from "zustand";
import { Chess } from "chess.js";
import {
  getValidMoves,
  getPiece,
} from "@/lib/chess/engine";
import { useGameStore } from "./gameStore";
import { useProgressStore } from "./progressStore";
import type { TacticsPuzzle, PuzzleMove } from "@/types/tactics";
import type { Square, PieceColor } from "@/types/chess";
import { playWrongMoveSound, playSuccessSound } from "@/lib/sounds";

export type TacticsStatus =
  | "idle"
  | "solving"
  | "opponent-moving"
  | "wrong-move"
  | "solved"
  | "showing-hint";

interface TacticsState {
  puzzle: TacticsPuzzle | null;
  currentMoveIndex: number;
  playerColor: PieceColor;
  status: TacticsStatus;
  wrongAttempts: number;
  hintsUsed: number;
  currentHintIndex: number;
  hintText: string | null;
  expectedMove: PuzzleMove | null;
  selectedSquare: Square | null;
  validMoveTargets: Square[];
  startTime: number;
  solvedPuzzles: Record<string, boolean>;
}

interface TacticsActions {
  loadPuzzle: (puzzle: TacticsPuzzle) => void;
  handleSquareClick: (square: Square) => void;
  attemptMove: (san: string, from: Square, to: Square) => void;
  playOpponentMove: () => void;
  showHint: () => void;
  retryPuzzle: () => void;
  cleanup: () => void;
}

export type TacticsStore = TacticsState & TacticsActions;

const OPPONENT_MOVE_DELAY = 500;
const WRONG_MOVE_RESET_DELAY = 800;
const AUTO_HINT_THRESHOLD = 3;
const STORAGE_KEY = "chess-coach:tactics-progress";

function loadSolvedPuzzles(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveSolvedPuzzles(solved: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(solved));
  } catch {
    // silently ignore
  }
}

const initialState: TacticsState = {
  puzzle: null,
  currentMoveIndex: 0,
  playerColor: "w",
  status: "idle",
  wrongAttempts: 0,
  hintsUsed: 0,
  currentHintIndex: 0,
  hintText: null,
  expectedMove: null,
  selectedSquare: null,
  validMoveTargets: [],
  startTime: 0,
  solvedPuzzles: {},
};

export const useTacticsStore = create<TacticsStore>((set, get) => ({
  ...initialState,

  loadPuzzle: (puzzle: TacticsPuzzle) => {
    const solved = loadSolvedPuzzles();

    // Reset the board to the puzzle position
    useGameStore.getState().reset(puzzle.fen);
    useGameStore.getState().setArrows([]);
    useGameStore.getState().setHighlights([]);

    const firstMove = puzzle.solution[0] ?? null;

    set({
      ...initialState,
      puzzle,
      playerColor: puzzle.playerColor,
      currentMoveIndex: 0,
      expectedMove: firstMove,
      status: "solving",
      startTime: Date.now(),
      solvedPuzzles: solved,
    });

    // If the first move is the opponent's, auto-play it
    if (firstMove && firstMove.color !== puzzle.playerColor) {
      set({ status: "opponent-moving" });
      setTimeout(() => {
        get().playOpponentMove();
      }, OPPONENT_MOVE_DELAY);
    }
  },

  handleSquareClick: (square: Square) => {
    const { status, playerColor, selectedSquare, validMoveTargets } = get();

    if (status !== "solving") return;

    // If clicking a valid move target, attempt the move
    if (selectedSquare && validMoveTargets.includes(square)) {
      const gameState = useGameStore.getState();
      const moves = getValidMoves(gameState.game, selectedSquare);
      const matchingMove = moves.find((m) => m.to === square);

      if (matchingMove) {
        get().attemptMove(matchingMove.san, selectedSquare, square);
      }
      return;
    }

    // If clicking the same square, deselect
    if (selectedSquare === square) {
      set({ selectedSquare: null, validMoveTargets: [] });
      return;
    }

    // Try to select a piece (must be player's color)
    const gameState = useGameStore.getState();
    const piece = getPiece(gameState.game, square);

    if (piece && piece.color === playerColor) {
      const moves = getValidMoves(gameState.game, square);
      if (moves.length > 0) {
        set({
          selectedSquare: square,
          validMoveTargets: moves.map((m) => m.to),
        });
        return;
      }
    }

    // Clicked empty/opponent square — clear selection
    set({ selectedSquare: null, validMoveTargets: [] });
  },

  attemptMove: (san: string, from: Square, to: Square) => {
    const { puzzle, currentMoveIndex, playerColor, solvedPuzzles } = get();
    if (!puzzle) return;

    const expectedMove = puzzle.solution[currentMoveIndex];
    if (!expectedMove) return;

    if (san === expectedMove.san) {
      // Correct move — execute it
      useGameStore.getState().move({ from, to });
      useGameStore.getState().setArrows([]);
      useGameStore.getState().setHighlights([]);

      const nextIndex = currentMoveIndex + 1;

      // Check if puzzle is solved
      if (nextIndex >= puzzle.solution.length) {
        const newSolved = { ...solvedPuzzles, [puzzle.id]: true };
        saveSolvedPuzzles(newSolved);
        const timeSpent = Date.now() - get().startTime;
        useProgressStore.getState().recordTacticsCompletion(
          puzzle.id,
          get().wrongAttempts,
          get().hintsUsed,
          timeSpent
        );
        playSuccessSound();
        set({
          currentMoveIndex: nextIndex,
          status: "solved",
          expectedMove: null,
          selectedSquare: null,
          validMoveTargets: [],
          hintText: expectedMove.annotation ?? null,
          solvedPuzzles: newSolved,
        });
        return;
      }

      const nextMove = puzzle.solution[nextIndex];

      set({
        currentMoveIndex: nextIndex,
        expectedMove: nextMove ?? null,
        selectedSquare: null,
        validMoveTargets: [],
        hintText: expectedMove.annotation ?? null,
      });

      // If the next move is the opponent's, auto-play it
      if (nextMove && nextMove.color !== playerColor) {
        set({ status: "opponent-moving" });
        setTimeout(() => {
          get().playOpponentMove();
        }, OPPONENT_MOVE_DELAY);
      }
    } else {
      // Wrong move
      const newWrongAttempts = get().wrongAttempts + 1;

      useGameStore.getState().setHighlights([{ square: to, color: "red" }]);
      playWrongMoveSound();

      set({
        status: "wrong-move",
        wrongAttempts: newWrongAttempts,
        selectedSquare: null,
        validMoveTargets: [],
      });

      // Auto-hint after threshold
      if (newWrongAttempts >= AUTO_HINT_THRESHOLD) {
        get().showHint();
      }

      // Reset to solving after delay
      setTimeout(() => {
        const current = get();
        if (current.status === "wrong-move") {
          useGameStore.getState().setHighlights([]);
          set({ status: "solving" });
        }
      }, WRONG_MOVE_RESET_DELAY);
    }
  },

  playOpponentMove: () => {
    const { puzzle, currentMoveIndex, playerColor, solvedPuzzles } = get();
    if (!puzzle) return;

    const move = puzzle.solution[currentMoveIndex];
    if (!move) return;

    // Resolve SAN to from/to
    const gameState = useGameStore.getState();
    const allMoves = getValidMoves(gameState.game);
    const resolvedMove = allMoves.find((m) => m.san === move.san);

    if (!resolvedMove) return;

    useGameStore.getState().move({ from: resolvedMove.from, to: resolvedMove.to });

    const nextIndex = currentMoveIndex + 1;

    // Check if puzzle is solved (opponent made last move)
    if (nextIndex >= puzzle.solution.length) {
      const newSolved = { ...solvedPuzzles, [puzzle.id]: true };
      saveSolvedPuzzles(newSolved);
      const timeSpent = Date.now() - get().startTime;
      useProgressStore.getState().recordTacticsCompletion(
        puzzle.id,
        get().wrongAttempts,
        get().hintsUsed,
        timeSpent
      );
      set({
        currentMoveIndex: nextIndex,
        status: "solved",
        expectedMove: null,
        selectedSquare: null,
        validMoveTargets: [],
        hintText: move.annotation ?? null,
        solvedPuzzles: newSolved,
      });
      return;
    }

    const nextMove = puzzle.solution[nextIndex];
    set({
      currentMoveIndex: nextIndex,
      status: "solving",
      expectedMove: nextMove ?? null,
      selectedSquare: null,
      validMoveTargets: [],
    });
  },

  showHint: () => {
    const { puzzle, expectedMove, currentHintIndex } = get();
    if (!puzzle) return;

    // Show text hint first
    if (currentHintIndex < puzzle.hints.length) {
      set({
        hintText: puzzle.hints[currentHintIndex],
        currentHintIndex: currentHintIndex + 1,
        hintsUsed: get().hintsUsed + 1,
      });
      return;
    }

    // After all text hints, show arrow on the expected move
    if (!expectedMove) return;

    const gameState = useGameStore.getState();
    const allMoves = getValidMoves(gameState.game);
    const resolvedMove = allMoves.find((m) => m.san === expectedMove.san);

    if (resolvedMove) {
      useGameStore.getState().setArrows([
        { from: resolvedMove.from, to: resolvedMove.to, color: "green" },
      ]);
      set({ hintsUsed: get().hintsUsed + 1 });
    }
  },

  retryPuzzle: () => {
    const { puzzle } = get();
    if (!puzzle) return;
    get().loadPuzzle(puzzle);
  },

  cleanup: () => {
    set({ ...initialState });
    useGameStore.getState().setArrows([]);
    useGameStore.getState().setHighlights([]);
  },
}));
