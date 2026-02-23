import { describe, it, expect, beforeEach, vi } from "vitest";
import { useAnalysisStore } from "./analysisStore";
import { useGameStore } from "./gameStore";
import { useCoachStore } from "./coachStore";
import type { AnalysisStore } from "./analysisStore";

function getStore(): AnalysisStore {
  return useAnalysisStore.getState();
}

const VALID_PGN = `[White "Alice"]
[Black "Bob"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 1-0`;

describe("analysisStore", () => {
  beforeEach(() => {
    getStore().reset();
    useGameStore.getState().reset();
    vi.restoreAllMocks();
  });

  describe("importPGN", () => {
    it("parses valid PGN and sets parsedGame", () => {
      getStore().importPGN(VALID_PGN);
      const state = getStore();
      expect(state.parsedGame).not.toBeNull();
      expect(state.parsedGame!.moves).toHaveLength(5);
      expect(state.parsedGame!.headers.white).toBe("Alice");
      expect(state.isImporting).toBe(false);
      expect(state.importError).toBeNull();
    });

    it("loads the game into gameStore", () => {
      getStore().importPGN(VALID_PGN);
      const gameState = useGameStore.getState();
      expect(gameState.isNavigating).toBe(true);
      expect(gameState.positionHistory).toHaveLength(5);
    });

    it("sets coach mode to analysis", () => {
      getStore().importPGN(VALID_PGN);
      expect(useCoachStore.getState().mode).toBe("analysis");
    });

    it("clears previous chat on import", () => {
      // Send a mock message by directly setting state
      useCoachStore.setState({ messages: [{ id: "1", role: "student", content: "hi", timestamp: Date.now() }] });
      expect(useCoachStore.getState().messages).toHaveLength(1);
      getStore().importPGN(VALID_PGN);
      expect(useCoachStore.getState().messages).toHaveLength(0);
    });

    it("sets error on invalid PGN", () => {
      getStore().importPGN("this is invalid pgn 1. Zz9");
      const state = getStore();
      expect(state.parsedGame).toBeNull();
      expect(state.importError).toBeTruthy();
      expect(state.isImporting).toBe(false);
    });

    it("clears moveAnnotations on new import", () => {
      getStore().importPGN(VALID_PGN);
      getStore().annotateMoveQuality(0, "good");
      expect(getStore().moveAnnotations.size).toBe(1);
      getStore().importPGN(VALID_PGN);
      expect(getStore().moveAnnotations.size).toBe(0);
    });
  });

  describe("importFromUrl", () => {
    it("fetches PGN from Lichess and imports", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(VALID_PGN),
      }));

      await getStore().importFromUrl("https://lichess.org/abcdefgh");
      const state = getStore();
      expect(state.parsedGame).not.toBeNull();
      expect(state.parsedGame!.moves).toHaveLength(5);
      expect(state.isImporting).toBe(false);
    });

    it("sets error on invalid URL", async () => {
      await getStore().importFromUrl("https://chess.com/game");
      const state = getStore();
      expect(state.importError).toBeTruthy();
      expect(state.parsedGame).toBeNull();
    });

    it("sets error on fetch failure", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      }));

      await getStore().importFromUrl("https://lichess.org/abcdefgh");
      const state = getStore();
      expect(state.importError).toBeTruthy();
      expect(state.parsedGame).toBeNull();
    });
  });

  describe("annotateMoveQuality", () => {
    it("stores move annotations", () => {
      getStore().annotateMoveQuality(0, "brilliant");
      getStore().annotateMoveQuality(3, "mistake");
      const annotations = getStore().moveAnnotations;
      expect(annotations.get(0)).toBe("brilliant");
      expect(annotations.get(3)).toBe("mistake");
    });

    it("overwrites existing annotation", () => {
      getStore().annotateMoveQuality(0, "good");
      getStore().annotateMoveQuality(0, "inaccuracy");
      expect(getStore().moveAnnotations.get(0)).toBe("inaccuracy");
    });
  });

  describe("reset", () => {
    it("clears all analysis state", () => {
      getStore().importPGN(VALID_PGN);
      getStore().annotateMoveQuality(0, "good");
      getStore().reset();

      const state = getStore();
      expect(state.parsedGame).toBeNull();
      expect(state.moveAnnotations.size).toBe(0);
      expect(state.importError).toBeNull();
      expect(state.isImporting).toBe(false);
    });

    it("exits navigation in gameStore", () => {
      getStore().importPGN(VALID_PGN);
      expect(useGameStore.getState().isNavigating).toBe(true);
      getStore().reset();
      expect(useGameStore.getState().isNavigating).toBe(false);
    });

    it("resets coach mode to free-play", () => {
      getStore().importPGN(VALID_PGN);
      expect(useCoachStore.getState().mode).toBe("analysis");
      getStore().reset();
      expect(useCoachStore.getState().mode).toBe("free-play");
    });
  });
});
