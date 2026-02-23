import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChatMessage } from "./ChatMessage";
import type { ChatMessage as ChatMessageType } from "@/types/coach";

function makeMessage(
  overrides: Partial<ChatMessageType> = {}
): ChatMessageType {
  return {
    id: "test-1",
    role: "coach",
    content: "Hello, student!",
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("ChatMessage", () => {
  it("renders coach message content", () => {
    render(<ChatMessage message={makeMessage({ content: "Play e4!" })} />);
    expect(screen.getByText("Play e4!")).toBeInTheDocument();
  });

  it("renders student message content", () => {
    render(
      <ChatMessage
        message={makeMessage({ role: "student", content: "What should I do?" })}
      />
    );
    expect(screen.getByText("What should I do?")).toBeInTheDocument();
  });

  it("shows 'Coach' label for coach messages", () => {
    render(<ChatMessage message={makeMessage()} />);
    expect(screen.getByText("Coach")).toBeInTheDocument();
  });

  it("does not show 'Coach' label for student messages", () => {
    render(
      <ChatMessage message={makeMessage({ role: "student" })} />
    );
    expect(screen.queryByText("Coach")).not.toBeInTheDocument();
  });

  it("shows move quality badge when present", () => {
    render(
      <ChatMessage
        message={makeMessage({
          coachResponse: {
            message: "Good move!",
            fen: null,
            arrows: [],
            highlights: [],
            engineMove: null,
            suggestedMove: null,
            moveQuality: "good",
          },
        })}
      />
    );
    expect(screen.getByText("good")).toBeInTheDocument();
  });

  it("does not show quality badge when moveQuality is null", () => {
    render(
      <ChatMessage
        message={makeMessage({
          coachResponse: {
            message: "Hello",
            fen: null,
            arrows: [],
            highlights: [],
            engineMove: null,
            suggestedMove: null,
            moveQuality: null,
          },
        })}
      />
    );
    expect(screen.queryByText("brilliant")).not.toBeInTheDocument();
    expect(screen.queryByText("good")).not.toBeInTheDocument();
    expect(screen.queryByText("blunder")).not.toBeInTheDocument();
  });

  it("shows blunder badge with correct text", () => {
    render(
      <ChatMessage
        message={makeMessage({
          coachResponse: {
            message: "That was a blunder!",
            fen: null,
            arrows: [],
            highlights: [],
            engineMove: null,
            suggestedMove: null,
            moveQuality: "blunder",
          },
        })}
      />
    );
    expect(screen.getByText("blunder")).toBeInTheDocument();
  });

  it("shows arrow legend when coach message has arrows", () => {
    render(
      <ChatMessage
        message={makeMessage({
          coachResponse: {
            message: "Here are your options",
            fen: null,
            arrows: [
              { from: "e2", to: "e4", color: "green" },
              { from: "d2", to: "d4", color: "blue" },
            ],
            highlights: [],
            engineMove: null,
            suggestedMove: null,
            moveQuality: null,
          },
        })}
      />
    );
    expect(screen.getByTestId("arrow-legend")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("recommended")).toBeInTheDocument();
    expect(screen.getByText("alternative")).toBeInTheDocument();
  });

  it("does not show arrow legend when arrows are empty", () => {
    render(
      <ChatMessage
        message={makeMessage({
          coachResponse: {
            message: "No arrows here",
            fen: null,
            arrows: [],
            highlights: [],
            engineMove: null,
            suggestedMove: null,
            moveQuality: null,
          },
        })}
      />
    );
    expect(screen.queryByTestId("arrow-legend")).not.toBeInTheDocument();
  });

  it("does not show arrow legend for student messages", () => {
    render(
      <ChatMessage
        message={makeMessage({ role: "student", content: "My move" })}
      />
    );
    expect(screen.queryByTestId("arrow-legend")).not.toBeInTheDocument();
  });

  it("preserves whitespace in message content", () => {
    render(
      <ChatMessage
        message={makeMessage({ content: "Line 1\nLine 2\nLine 3" })}
      />
    );
    const el = screen.getByText(/Line 1/);
    expect(el).toHaveClass("whitespace-pre-wrap");
  });
});
