import { create } from "zustand";
import { Chess } from "chess.js";
import {
  createGame,
  getValidMoves,
  getPiece,
} from "@/lib/chess/engine";
import { useGameStore } from "./gameStore";
import { useProgressStore } from "./progressStore";
import type { Opening, OpeningVariation, OpeningMove } from "@/types/opening";
import type { Square, PieceColor } from "@/types/chess";

export type TrainerStatus =
  | "idle"
  | "playing"
  | "opponent-moving"
  | "wrong-move"
  | "completed";

interface OpeningTrainerState {
  opening: Opening | null;
  activeVariation: OpeningVariation | null;
  currentMoveIndex: number;
  playerColor: PieceColor;
  status: TrainerStatus;
  wrongAttempts: number;
  currentAnnotation: string | null;
  expectedMove: OpeningMove | null;
  completedVariations: Record<string, boolean>;
  selectedSquare: Square | null;
  validMoveTargets: Square[];
}

interface OpeningTrainerActions {
  initOpening: (opening: Opening) => void;
  startVariation: (variationId: string) => void;
  handleSquareClick: (square: Square) => void;
  attemptMove: (san: string, from: Square, to: Square) => void;
  playOpponentMove: () => void;
  retryVariation: () => void;
  showHint: () => void;
  cleanup: () => void;
}

export type OpeningTrainerStore = OpeningTrainerState & OpeningTrainerActions;

function getStorageKey(openingId: string): string {
  return `chess-coach:opening-progress:${openingId}`;
}

function loadCompletedVariations(openingId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(getStorageKey(openingId));
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, boolean>;
  } catch {
    return {};
  }
}

function saveCompletedVariations(
  openingId: string,
  completed: Record<string, boolean>
): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getStorageKey(openingId), JSON.stringify(completed));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

const OPPONENT_MOVE_DELAY = 500;
const WRONG_MOVE_RESET_DELAY = 800;
const AUTO_HINT_THRESHOLD = 3;

const initialState: OpeningTrainerState = {
  opening: null,
  activeVariation: null,
  currentMoveIndex: 0,
  playerColor: "w",
  status: "idle",
  wrongAttempts: 0,
  currentAnnotation: null,
  expectedMove: null,
  completedVariations: {},
  selectedSquare: null,
  validMoveTargets: [],
};

export const useOpeningTrainerStore = create<OpeningTrainerStore>((set, get) => ({
  ...initialState,

  initOpening: (opening: Opening) => {
    const completed = loadCompletedVariations(opening.id);
    set({
      ...initialState,
      opening,
      playerColor: opening.playerColor,
      completedVariations: completed,
    });
  },

  startVariation: (variationId: string) => {
    const { opening, playerColor } = get();
    if (!opening) return;

    const variation = opening.variations.find((v) => v.id === variationId);
    if (!variation) return;

    // Reset the board to the opening's starting position
    useGameStore.getState().reset(opening.startingFen);
    useGameStore.getState().setArrows([]);
    useGameStore.getState().setHighlights([]);

    const firstMove = variation.moves[0] ?? null;

    set({
      activeVariation: variation,
      currentMoveIndex: 0,
      wrongAttempts: 0,
      currentAnnotation: firstMove?.annotation ?? null,
      expectedMove: firstMove,
      selectedSquare: null,
      validMoveTargets: [],
      status: "playing",
    });

    // If the first move is the opponent's, auto-play it
    if (firstMove && firstMove.color !== playerColor) {
      set({ status: "opponent-moving" });
      setTimeout(() => {
        get().playOpponentMove();
      }, OPPONENT_MOVE_DELAY);
    }
  },

  handleSquareClick: (square: Square) => {
    const { status, playerColor, selectedSquare, validMoveTargets } = get();

    if (status !== "playing") return;

    // If clicking a valid move target, attempt the move
    if (selectedSquare && validMoveTargets.includes(square)) {
      // Resolve the SAN for this move
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
    const { activeVariation, currentMoveIndex, playerColor, opening, completedVariations } = get();
    if (!activeVariation || !opening) return;

    const expectedMove = activeVariation.moves[currentMoveIndex];
    if (!expectedMove) return;

    if (san === expectedMove.san) {
      // Correct move — execute it on the game board
      useGameStore.getState().move({ from, to });
      useGameStore.getState().setArrows([]);
      useGameStore.getState().setHighlights([]);

      const nextIndex = currentMoveIndex + 1;

      // Check if this was the last move
      if (nextIndex >= activeVariation.moves.length) {
        const newCompleted = { ...completedVariations, [activeVariation.id]: true };
        saveCompletedVariations(opening.id, newCompleted);
        useProgressStore.getState().recordVariationCompletion(
          opening.id,
          activeVariation.id,
          activeVariation.moves.length,
          get().wrongAttempts
        );
        set({
          currentMoveIndex: nextIndex,
          status: "completed",
          wrongAttempts: 0,
          currentAnnotation: null,
          expectedMove: null,
          completedVariations: newCompleted,
          selectedSquare: null,
          validMoveTargets: [],
        });
        return;
      }

      const nextMove = activeVariation.moves[nextIndex];

      set({
        currentMoveIndex: nextIndex,
        wrongAttempts: 0,
        currentAnnotation: nextMove?.annotation ?? null,
        expectedMove: nextMove ?? null,
        selectedSquare: null,
        validMoveTargets: [],
      });

      // If the next move is the opponent's, auto-play it
      if (nextMove && nextMove.color !== playerColor) {
        set({ status: "opponent-moving" });
        setTimeout(() => {
          get().playOpponentMove();
        }, OPPONENT_MOVE_DELAY);
      }
    } else {
      // Wrong move — do NOT execute it
      const newWrongAttempts = get().wrongAttempts + 1;

      // Show red highlight on the target square
      useGameStore.getState().setHighlights([{ square: to, color: "red" }]);

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

      // Reset to playing after delay
      setTimeout(() => {
        const current = get();
        if (current.status === "wrong-move") {
          useGameStore.getState().setHighlights([]);
          set({ status: "playing" });
        }
      }, WRONG_MOVE_RESET_DELAY);
    }
  },

  playOpponentMove: () => {
    const { activeVariation, currentMoveIndex, playerColor, opening, completedVariations } = get();
    if (!activeVariation || !opening) return;

    const move = activeVariation.moves[currentMoveIndex];
    if (!move) return;

    // Resolve the SAN to a concrete from/to
    const gameState = useGameStore.getState();
    const allMoves = getValidMoves(gameState.game);
    const resolvedMove = allMoves.find((m) => m.san === move.san);

    if (!resolvedMove) return;

    useGameStore.getState().move({ from: resolvedMove.from, to: resolvedMove.to });

    const nextIndex = currentMoveIndex + 1;

    // Check if this was the last move
    if (nextIndex >= activeVariation.moves.length) {
      const newCompleted = { ...completedVariations, [activeVariation.id]: true };
      saveCompletedVariations(opening.id, newCompleted);
      useProgressStore.getState().recordVariationCompletion(
        opening.id,
        activeVariation.id,
        activeVariation.moves.length,
        get().wrongAttempts
      );
      set({
        currentMoveIndex: nextIndex,
        status: "completed",
        currentAnnotation: null,
        expectedMove: null,
        completedVariations: newCompleted,
        selectedSquare: null,
        validMoveTargets: [],
      });
      return;
    }

    const nextMove = activeVariation.moves[nextIndex];
    set({
      currentMoveIndex: nextIndex,
      status: "playing",
      currentAnnotation: nextMove?.annotation ?? null,
      expectedMove: nextMove ?? null,
      selectedSquare: null,
      validMoveTargets: [],
    });
  },

  retryVariation: () => {
    const { activeVariation } = get();
    if (!activeVariation) return;
    get().startVariation(activeVariation.id);
  },

  showHint: () => {
    const { expectedMove } = get();
    if (!expectedMove) return;

    // Resolve the expected move SAN to get from/to
    const gameState = useGameStore.getState();
    const allMoves = getValidMoves(gameState.game);
    const resolvedMove = allMoves.find((m) => m.san === expectedMove.san);

    if (resolvedMove) {
      useGameStore.getState().setArrows([
        { from: resolvedMove.from, to: resolvedMove.to, color: "green" },
      ]);
    }
  },

  cleanup: () => {
    set({ ...initialState });
    useGameStore.getState().setArrows([]);
    useGameStore.getState().setHighlights([]);
  },
}));
