import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCoachStore } from "./coachStore";
import { useGameStore } from "./gameStore";
import type { CoachStore } from "./coachStore";
import type { CoachResponse } from "@/types/coach";

function getCoachStore(): CoachStore {
  return useCoachStore.getState();
}

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockSuccessResponse(coachResponse: Partial<CoachResponse>) {
  const fullResponse: CoachResponse = {
    message: "Good move!",
    fen: null,
    arrows: [],
    highlights: [],
    engineMove: null,
    suggestedMove: null,
    moveQuality: null,
    ...coachResponse,
  };
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(fullResponse),
  });
}

function mockErrorResponse(status: number, error: string) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
}

describe("coachStore", () => {
  beforeEach(() => {
    // Reset both stores
    useCoachStore.setState({
      messages: [],
      isLoading: false,
      error: null,
      mode: "free-play",
    });
    useGameStore.getState().reset();
    mockFetch.mockClear();
  });

  describe("initial state", () => {
    it("starts with empty messages", () => {
      expect(getCoachStore().messages).toEqual([]);
    });

    it("starts with isLoading false", () => {
      expect(getCoachStore().isLoading).toBe(false);
    });

    it("starts with no error", () => {
      expect(getCoachStore().error).toBeNull();
    });

    it("starts in free-play mode", () => {
      expect(getCoachStore().mode).toBe("free-play");
    });
  });

  describe("sendMessage", () => {
    it("adds student message immediately", async () => {
      mockSuccessResponse({ message: "Hello!" });
      const promise = getCoachStore().sendMessage("What should I play?");

      // Student message should be added right away
      const state = getCoachStore();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe("student");
      expect(state.messages[0].content).toBe("What should I play?");
      expect(state.isLoading).toBe(true);

      await promise;
    });

    it("adds coach response after fetch completes", async () => {
      mockSuccessResponse({ message: "Play e4!" });
      await getCoachStore().sendMessage("What should I play?");

      const state = getCoachStore();
      expect(state.messages).toHaveLength(2);
      expect(state.messages[1].role).toBe("coach");
      expect(state.messages[1].content).toBe("Play e4!");
      expect(state.isLoading).toBe(false);
    });

    it("stores coachResponse on coach message", async () => {
      mockSuccessResponse({
        message: "Play e4!",
        moveQuality: "good",
        suggestedMove: "e2-e4",
      });
      await getCoachStore().sendMessage("How was my move?");

      const coachMsg = getCoachStore().messages[1];
      expect(coachMsg.coachResponse).toBeDefined();
      expect(coachMsg.coachResponse?.moveQuality).toBe("good");
      expect(coachMsg.coachResponse?.suggestedMove).toBe("e2-e4");
    });

    it("sends correct request body to /api/coach", async () => {
      mockSuccessResponse({ message: "Ok" });
      getCoachStore().setMode("analysis");
      await getCoachStore().sendMessage("Analyze this");

      expect(mockFetch).toHaveBeenCalledWith("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.message).toBe("Analyze this");
      expect(body.mode).toBe("analysis");
      expect(body.fen).toBe(useGameStore.getState().fen);
    });

    it("clears error before sending", async () => {
      useCoachStore.setState({ error: "Previous error" });
      mockSuccessResponse({ message: "Ok" });

      const promise = getCoachStore().sendMessage("Hello");
      expect(getCoachStore().error).toBeNull();
      await promise;
    });

    it("truncates chat history to last 20 messages", async () => {
      // Populate with 25 messages
      const messages = Array.from({ length: 25 }, (_, i) => ({
        id: `msg-${i}`,
        role: i % 2 === 0 ? ("student" as const) : ("coach" as const),
        content: `Message ${i}`,
        timestamp: Date.now() + i,
      }));
      useCoachStore.setState({ messages });

      mockSuccessResponse({ message: "Ok" });
      await getCoachStore().sendMessage("New message");

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      // 25 existing + 1 new = 26, truncated to 20
      expect(body.chatHistory.length).toBeLessThanOrEqual(20);
    });
  });

  describe("cross-store effects", () => {
    it("applies arrows to gameStore", async () => {
      mockSuccessResponse({
        message: "Watch this diagonal",
        arrows: [{ from: "c1", to: "h6", color: "green" }],
      });
      await getCoachStore().sendMessage("Show me");

      const gameState = useGameStore.getState();
      expect(gameState.arrows).toEqual([
        { from: "c1", to: "h6", color: "green" },
      ]);
    });

    it("applies highlights to gameStore as yellow SquareHighlights", async () => {
      mockSuccessResponse({
        message: "Key squares",
        highlights: ["e4", "d5"],
      });
      await getCoachStore().sendMessage("Show me");

      const gameState = useGameStore.getState();
      expect(gameState.highlights).toEqual([
        { square: "e4", color: "yellow" },
        { square: "d5", color: "yellow" },
      ]);
    });

    it("resets board when FEN is returned", async () => {
      mockSuccessResponse({
        message: "New position",
        fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
      });
      await getCoachStore().sendMessage("Show me e4");

      const gameState = useGameStore.getState();
      expect(gameState.fen).toBe(
        "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
      );
    });

    it("does not set arrows when response has empty arrows", async () => {
      // Set some arrows first
      useGameStore.getState().setArrows([
        { from: "e2", to: "e4", color: "green" },
      ]);
      mockSuccessResponse({ message: "Ok", arrows: [] });
      await getCoachStore().sendMessage("Hello");

      // Arrows should remain unchanged (not cleared)
      const gameState = useGameStore.getState();
      expect(gameState.arrows).toEqual([
        { from: "e2", to: "e4", color: "green" },
      ]);
    });
  });

  describe("error handling", () => {
    it("sets error on fetch failure", async () => {
      mockErrorResponse(500, "Server error");
      await getCoachStore().sendMessage("Hello");

      const state = getCoachStore();
      expect(state.error).toBe("Server error");
      expect(state.isLoading).toBe(false);
      // Student message should still be there
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0].role).toBe("student");
    });

    it("sets error on network failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      await getCoachStore().sendMessage("Hello");

      expect(getCoachStore().error).toBe("Network error");
      expect(getCoachStore().isLoading).toBe(false);
    });

    it("sets error on non-JSON error response", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.reject(new Error("Not JSON")),
      });
      await getCoachStore().sendMessage("Hello");

      expect(getCoachStore().error).toBe("Request failed (500)");
    });
  });

  describe("clearChat", () => {
    it("clears all messages", async () => {
      mockSuccessResponse({ message: "Hello!" });
      await getCoachStore().sendMessage("Hi");
      expect(getCoachStore().messages).toHaveLength(2);

      getCoachStore().clearChat();
      expect(getCoachStore().messages).toEqual([]);
    });

    it("clears error", () => {
      useCoachStore.setState({ error: "Some error" });
      getCoachStore().clearChat();
      expect(getCoachStore().error).toBeNull();
    });
  });

  describe("setMode", () => {
    it("changes coaching mode", () => {
      getCoachStore().setMode("tactics");
      expect(getCoachStore().mode).toBe("tactics");
    });

    it("accepts all valid modes", () => {
      const modes = [
        "free-play",
        "opening-trainer",
        "tactics",
        "endgame",
        "analysis",
        "planning",
      ] as const;
      for (const mode of modes) {
        getCoachStore().setMode(mode);
        expect(getCoachStore().mode).toBe(mode);
      }
    });
  });

  describe("dismissError", () => {
    it("clears error message", () => {
      useCoachStore.setState({ error: "Some error" });
      getCoachStore().dismissError();
      expect(getCoachStore().error).toBeNull();
    });
  });
});
