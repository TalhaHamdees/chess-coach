import { create } from "zustand";
import type { Piece, PieceColor, Square } from "@/types/chess";
import type { BoardMap } from "@/lib/chess/fen";
import {
  fenToBoardMap,
  boardMapToFen,
  isValidSetupPosition,
  START_BOARD_MAP,
} from "@/lib/chess/fen";
import { useGameStore } from "./gameStore";
import { useCoachStore } from "./coachStore";

interface CustomTrainerState {
  /** Current mode: setup = placing pieces, play = playing chess */
  mode: "setup" | "play";
  /** Current board piece map */
  boardMap: BoardMap;
  /** Currently selected piece in palette (null = eraser mode) */
  selectedPiece: Piece | null;
  /** Side to move when training starts */
  turn: PieceColor;
  /** Validation error for current position */
  validationError: string | null;
}

interface CustomTrainerActions {
  /** Place the selected piece on a square, or remove if eraser mode */
  placePiece: (square: Square) => void;
  /** Select a piece in the palette (null = eraser) */
  selectPiece: (piece: Piece | null) => void;
  /** Set the side to move */
  setTurn: (turn: PieceColor) => void;
  /** Clear all pieces from the board */
  clearBoard: () => void;
  /** Reset to starting position */
  resetToStart: () => void;
  /** Load a position from a FEN string */
  loadFromFen: (fen: string) => void;
  /** Validate and start training: returns true if successful */
  startTraining: () => boolean;
  /** Return to setup mode */
  backToSetup: () => void;
  /** Cleanup on unmount */
  cleanup: () => void;
}

export type CustomTrainerStore = CustomTrainerState & CustomTrainerActions;

function cloneMap(map: BoardMap): BoardMap {
  return new Map(map);
}

export const useCustomTrainerStore = create<CustomTrainerStore>((set, get) => ({
  mode: "setup",
  boardMap: cloneMap(START_BOARD_MAP),
  selectedPiece: { type: "p", color: "w" },
  turn: "w",
  validationError: null,

  placePiece: (square: Square) => {
    const { boardMap, selectedPiece } = get();
    const newMap = cloneMap(boardMap);

    if (selectedPiece === null) {
      // Eraser mode — remove piece
      newMap.delete(square);
    } else {
      newMap.set(square, { ...selectedPiece });
    }

    // Re-validate
    const validation = isValidSetupPosition(newMap);
    set({
      boardMap: newMap,
      validationError: validation.valid ? null : (validation.error ?? null),
    });
  },

  selectPiece: (piece: Piece | null) => {
    set({ selectedPiece: piece ? { ...piece } : null });
  },

  setTurn: (turn: PieceColor) => {
    set({ turn });
  },

  clearBoard: () => {
    set({
      boardMap: new Map(),
      validationError: "White king is missing",
    });
  },

  resetToStart: () => {
    set({
      boardMap: cloneMap(START_BOARD_MAP),
      validationError: null,
    });
  },

  loadFromFen: (fen: string) => {
    try {
      const map = fenToBoardMap(fen);
      const validation = isValidSetupPosition(map);

      // Extract turn from FEN
      const parts = fen.split(" ");
      const turn = (parts[1] === "b" ? "b" : "w") as PieceColor;

      set({
        boardMap: map,
        turn,
        validationError: validation.valid ? null : (validation.error ?? null),
      });
    } catch {
      set({ validationError: "Invalid FEN string" });
    }
  },

  startTraining: () => {
    const { boardMap, turn } = get();

    const validation = isValidSetupPosition(boardMap);
    if (!validation.valid) {
      set({ validationError: validation.error ?? "Invalid position" });
      return false;
    }

    const fen = boardMapToFen(boardMap, { turn, castling: "-" });

    // Set up game store with custom FEN
    useGameStore.getState().reset(fen);
    useCoachStore.getState().setMode("free-play");
    useCoachStore.getState().clearChat();

    set({ mode: "play", validationError: null });
    return true;
  },

  backToSetup: () => {
    set({ mode: "setup" });
  },

  cleanup: () => {
    set({
      mode: "setup",
      boardMap: cloneMap(START_BOARD_MAP),
      selectedPiece: { type: "p", color: "w" },
      turn: "w",
      validationError: null,
    });
  },
}));
