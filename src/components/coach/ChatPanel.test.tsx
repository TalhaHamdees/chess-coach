import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatPanel } from "./ChatPanel";
import { useCoachStore } from "@/stores/coachStore";
import { useGameStore } from "@/stores/gameStore";

// Mock ResizeObserver for jsdom (used by scroll-area)
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe("ChatPanel", () => {
  beforeEach(() => {
    useCoachStore.setState({
      messages: [],
      isLoading: false,
      error: null,
      mode: "free-play",
    });
    useGameStore.getState().reset();
  });

  it("renders the chat panel with title", () => {
    render(<ChatPanel />);
    expect(screen.getByText("Coach Chat")).toBeInTheDocument();
  });

  it("shows welcome state when no messages", () => {
    render(<ChatPanel />);
    expect(screen.getByText("Your personal chess coach")).toBeInTheDocument();
    expect(
      screen.getByText(/Ask about your position/)
    ).toBeInTheDocument();
  });

  it("renders the input field", () => {
    render(<ChatPanel />);
    expect(
      screen.getByPlaceholderText("Ask your coach...")
    ).toBeInTheDocument();
  });

  it("shows suggested prompts when no messages", () => {
    render(<ChatPanel />);
    expect(screen.getByText("Explain this position")).toBeInTheDocument();
    expect(screen.getByText("What's the best move?")).toBeInTheDocument();
    expect(screen.getByText("What should my plan be?")).toBeInTheDocument();
    expect(screen.getByText("Any tactics here?")).toBeInTheDocument();
    expect(screen.getByText("Evaluate my position")).toBeInTheDocument();
  });

  it("disables send button when input is empty", () => {
    render(<ChatPanel />);
    const sendButton = screen.getByRole("button", { name: "" });
    // The icon button — find by checking disabled state
    const buttons = screen.getAllByRole("button");
    const iconButton = buttons.find((b) =>
      b.querySelector("[data-slot='icon']") !== null ||
      b.querySelector("svg") !== null
    );
    // Last button should be the send button
    const lastButton = buttons[buttons.length - 1];
    expect(lastButton).toBeDisabled();
  });

  it("enables send button when input has text", () => {
    render(<ChatPanel />);
    const input = screen.getByPlaceholderText("Ask your coach...");
    fireEvent.change(input, { target: { value: "Hello" } });

    const buttons = screen.getAllByRole("button");
    const lastButton = buttons[buttons.length - 1];
    expect(lastButton).not.toBeDisabled();
  });

  it("clears input after sending", () => {
    // Mock sendMessage
    const sendMessage = vi.fn();
    useCoachStore.setState({ sendMessage });

    render(<ChatPanel />);
    const input = screen.getByPlaceholderText(
      "Ask your coach..."
    ) as HTMLInputElement;

    fireEvent.change(input, { target: { value: "Hello coach" } });
    expect(input.value).toBe("Hello coach");

    // Press Enter to send
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input.value).toBe("");
    expect(sendMessage).toHaveBeenCalledWith("Hello coach");
  });

  it("shows error banner when error is set", () => {
    useCoachStore.setState({ error: "Something went wrong" });
    render(<ChatPanel />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("has dismiss button on error banner", () => {
    const dismissError = vi.fn();
    useCoachStore.setState({
      error: "Test error",
      dismissError,
    });
    render(<ChatPanel />);

    const dismissBtn = screen.getByLabelText("Dismiss error");
    fireEvent.click(dismissBtn);
    expect(dismissError).toHaveBeenCalled();
  });

  it("shows typing indicator when loading", () => {
    useCoachStore.setState({ isLoading: true });
    render(<ChatPanel />);
    // The bouncing dots should be visible
    const dots = screen.getAllByText(".");
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it("renders messages from store", () => {
    useCoachStore.setState({
      messages: [
        {
          id: "1",
          role: "student",
          content: "What should I play?",
          timestamp: Date.now(),
        },
        {
          id: "2",
          role: "coach",
          content: "Consider e4!",
          timestamp: Date.now(),
        },
      ],
    });
    render(<ChatPanel />);
    expect(screen.getByText("What should I play?")).toBeInTheDocument();
    expect(screen.getByText("Consider e4!")).toBeInTheDocument();
  });

  it("disables input when loading", () => {
    useCoachStore.setState({ isLoading: true });
    render(<ChatPanel />);
    const input = screen.getByPlaceholderText("Ask your coach...");
    expect(input).toBeDisabled();
  });
});
