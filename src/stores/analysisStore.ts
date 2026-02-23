import { create } from "zustand";
import type { ParsedGame } from "@/types/chess";
import type { MoveQuality } from "@/types/coach";
import { parsePGN, fetchLichessGamePGN } from "@/lib/chess/pgn";
import { useGameStore } from "./gameStore";
import { useCoachStore } from "./coachStore";

interface AnalysisState {
  parsedGame: ParsedGame | null;
  isImporting: boolean;
  importError: string | null;
  moveAnnotations: Map<number, MoveQuality>;
}

interface AnalysisActions {
  /** Import a PGN string, parse it, and load the game */
  importPGN: (pgn: string) => void;
  /** Import a game from a Lichess URL */
  importFromUrl: (url: string) => Promise<void>;
  /** Store an AI-provided move annotation */
  annotateMoveQuality: (moveIndex: number, quality: MoveQuality) => void;
  /** Reset analysis state and exit navigation */
  reset: () => void;
}

export type AnalysisStore = AnalysisState & AnalysisActions;

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  parsedGame: null,
  isImporting: false,
  importError: null,
  moveAnnotations: new Map(),

  importPGN: (pgn: string) => {
    try {
      set({ isImporting: true, importError: null });
      const parsed = parsePGN(pgn);
      set({
        parsedGame: parsed,
        isImporting: false,
        moveAnnotations: new Map(),
      });

      // Load game into gameStore for board navigation
      useGameStore.getState().loadGame(parsed);

      // Set coach mode to analysis
      useCoachStore.getState().setMode("analysis");
      useCoachStore.getState().clearChat();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to parse PGN";
      set({ isImporting: false, importError: message, parsedGame: null });
    }
  },

  importFromUrl: async (url: string) => {
    try {
      set({ isImporting: true, importError: null });
      const pgn = await fetchLichessGamePGN(url);
      // Use importPGN which handles all the store wiring
      get().importPGN(pgn);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to fetch game";
      set({ isImporting: false, importError: message, parsedGame: null });
    }
  },

  annotateMoveQuality: (moveIndex: number, quality: MoveQuality) => {
    const newAnnotations = new Map(get().moveAnnotations);
    newAnnotations.set(moveIndex, quality);
    set({ moveAnnotations: newAnnotations });
  },

  reset: () => {
    useGameStore.getState().exitNavigation();
    useCoachStore.getState().setMode("free-play");
    useCoachStore.getState().clearChat();
    set({
      parsedGame: null,
      isImporting: false,
      importError: null,
      moveAnnotations: new Map(),
    });
  },
}));
