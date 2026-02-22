import { create } from "zustand";
import type {
  ChatMessage,
  CoachingMode,
  CoachResponse,
  CoachRequest,
} from "@/types/coach";
import type { SquareHighlight } from "@/types/chess";
import { useGameStore } from "./gameStore";

interface CoachState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  mode: CoachingMode;
}

interface CoachActions {
  sendMessage: (content: string) => Promise<void>;
  clearChat: () => void;
  setMode: (mode: CoachingMode) => void;
  dismissError: () => void;
}

export type CoachStore = CoachState & CoachActions;

const MAX_HISTORY_MESSAGES = 20;

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useCoachStore = create<CoachStore>((set, get) => ({
  messages: [],
  isLoading: false,
  error: null,
  mode: "free-play",

  sendMessage: async (content: string) => {
    const { messages, mode } = get();
    const gameState = useGameStore.getState();

    // Add student message immediately
    const studentMessage: ChatMessage = {
      id: generateId(),
      role: "student",
      content,
      timestamp: Date.now(),
    };

    set({
      messages: [...messages, studentMessage],
      isLoading: true,
      error: null,
    });

    // Build chat history (truncated to last N messages)
    const allMessages = [...messages, studentMessage];
    const recentHistory = allMessages.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const requestBody: CoachRequest = {
      message: content,
      fen: gameState.fen,
      moveHistory: gameState.moveHistory,
      mode,
      chatHistory: recentHistory,
    };

    try {
      const response = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          (errorData as { error?: string } | null)?.error ??
          `Request failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const coachResponse: CoachResponse = await response.json();

      const coachMessage: ChatMessage = {
        id: generateId(),
        role: "coach",
        content: coachResponse.message,
        timestamp: Date.now(),
        coachResponse,
      };

      set((state) => ({
        messages: [...state.messages, coachMessage],
        isLoading: false,
      }));

      // Apply visual effects to game board
      if (coachResponse.arrows.length > 0) {
        useGameStore.getState().setArrows(coachResponse.arrows);
      }
      if (coachResponse.highlights.length > 0) {
        const squareHighlights: SquareHighlight[] =
          coachResponse.highlights.map((square) => ({
            square,
            color: "yellow",
          }));
        useGameStore.getState().setHighlights(squareHighlights);
      }
      if (coachResponse.fen) {
        useGameStore.getState().reset(coachResponse.fen);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to get coach response.";
      set({ isLoading: false, error: errorMessage });
    }
  },

  clearChat: () => {
    set({ messages: [], error: null });
  },

  setMode: (mode: CoachingMode) => {
    set({ mode });
  },

  dismissError: () => {
    set({ error: null });
  },
}));
