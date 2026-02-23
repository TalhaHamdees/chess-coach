import { create } from "zustand";
import { Chess } from "chess.js";
import {
  getValidMoves,
  getPiece,
} from "@/lib/chess/engine";
import { useGameStore } from "./gameStore";
import { useProgressStore } from "./progressStore";
import type { EndgamePosition, EndgameMove } from "@/types/endgame";
import type { Square, PieceColor } from "@/types/chess";
import { playWrongMoveSound, playSuccessSound } from "@/lib/sounds";

export type EndgameStatus =
  | "idle"
  | "solving"
  | "opponent-moving"
  | "wrong-move"
  | "completed";

interface EndgameState {
  position: EndgamePosition | null;
  currentMoveIndex: number;
  playerColor: PieceColor;
  status: EndgameStatus;
  wrongAttempts: number;
  hintsUsed: number;
  currentHintIndex: number;
  hintText: string | null;
  expectedMove: EndgameMove | null;
  selectedSquare: Square | null;
  validMoveTargets: Square[];
  completedPositions: Record<string, boolean>;
}

interface EndgameActions {
  loadPosition: (position: EndgamePosition) => void;
  handleSquareClick: (square: Square) => void;
  attemptMove: (san: string, from: Square, to: Square) => void;
  playOpponentMove: () => void;
  showHint: () => void;
  retryPosition: () => void;
  cleanup: () => void;
}

export type EndgameStore = EndgameState & EndgameActions;

const OPPONENT_MOVE_DELAY = 500;
const WRONG_MOVE_RESET_DELAY = 800;
const AUTO_HINT_THRESHOLD = 3;
const STORAGE_KEY = "chess-coach:endgame-progress";

function loadCompletedPositions(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveCompletedPositions(completed: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(completed));
  } catch {
    // silently ignore
  }
}

const initialState: EndgameState = {
  position: null,
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
  completedPositions: {},
};

export const useEndgameStore = create<EndgameStore>((set, get) => ({
  ...initialState,

  loadPosition: (position: EndgamePosition) => {
    const completed = loadCompletedPositions();

    // Reset the board to the endgame position
    useGameStore.getState().reset(position.fen);
    useGameStore.getState().setArrows([]);
    useGameStore.getState().setHighlights([]);

    const firstMove = position.solution[0] ?? null;

    set({
      ...initialState,
      position,
      playerColor: position.playerColor,
      currentMoveIndex: 0,
      expectedMove: firstMove,
      status: "solving",
      completedPositions: completed,
    });

    // If the first move is the opponent's, auto-play it
    if (firstMove && firstMove.color !== position.playerColor) {
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
    const { position, currentMoveIndex, playerColor, completedPositions } = get();
    if (!position) return;

    const expectedMove = position.solution[currentMoveIndex];
    if (!expectedMove) return;

    if (san === expectedMove.san) {
      // Correct move — execute it
      useGameStore.getState().move({ from, to });
      useGameStore.getState().setArrows([]);
      useGameStore.getState().setHighlights([]);

      const nextIndex = currentMoveIndex + 1;

      // Check if sequence is completed
      if (nextIndex >= position.solution.length) {
        const newCompleted = { ...completedPositions, [position.id]: true };
        saveCompletedPositions(newCompleted);
        useProgressStore.getState().recordEndgameCompletion(
          position.id,
          get().wrongAttempts,
          get().hintsUsed
        );
        playSuccessSound();
        set({
          currentMoveIndex: nextIndex,
          status: "completed",
          expectedMove: null,
          selectedSquare: null,
          validMoveTargets: [],
          hintText: expectedMove.annotation ?? null,
          completedPositions: newCompleted,
        });
        return;
      }

      const nextMove = position.solution[nextIndex];

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

      if (newWrongAttempts >= AUTO_HINT_THRESHOLD) {
        get().showHint();
      }

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
    const { position, currentMoveIndex, playerColor, completedPositions } = get();
    if (!position) return;

    const move = position.solution[currentMoveIndex];
    if (!move) return;

    // Resolve SAN to from/to
    const gameState = useGameStore.getState();
    const allMoves = getValidMoves(gameState.game);
    const resolvedMove = allMoves.find((m) => m.san === move.san);

    if (!resolvedMove) return;

    useGameStore.getState().move({ from: resolvedMove.from, to: resolvedMove.to });

    const nextIndex = currentMoveIndex + 1;

    if (nextIndex >= position.solution.length) {
      const newCompleted = { ...completedPositions, [position.id]: true };
      saveCompletedPositions(newCompleted);
      useProgressStore.getState().recordEndgameCompletion(
        position.id,
        get().wrongAttempts,
        get().hintsUsed
      );
      set({
        currentMoveIndex: nextIndex,
        status: "completed",
        expectedMove: null,
        selectedSquare: null,
        validMoveTargets: [],
        completedPositions: newCompleted,
      });
      return;
    }

    const nextMove = position.solution[nextIndex];
    set({
      currentMoveIndex: nextIndex,
      status: "solving",
      expectedMove: nextMove ?? null,
      selectedSquare: null,
      validMoveTargets: [],
    });
  },

  showHint: () => {
    const { position, expectedMove, currentHintIndex } = get();
    if (!position) return;

    // Show text hint first
    if (currentHintIndex < position.hints.length) {
      set({
        hintText: position.hints[currentHintIndex],
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

  retryPosition: () => {
    const { position } = get();
    if (!position) return;
    get().loadPosition(position);
  },

  cleanup: () => {
    set({ ...initialState });
    useGameStore.getState().setArrows([]);
    useGameStore.getState().setHighlights([]);
  },
}));
