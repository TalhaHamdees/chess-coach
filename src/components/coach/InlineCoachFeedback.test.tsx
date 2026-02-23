import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { InlineCoachFeedback } from "./InlineCoachFeedback";

let mockStoreState = {
  messages: [] as Array<{
    id: string;
    role: "student" | "coach";
    content: string;
    timestamp: number;
    coachResponse?: {
      message: string;
      fen: string | null;
      arrows: never[];
      highlights: never[];
      engineMove: string | null;
      suggestedMove: string | null;
      moveQuality: string | null;
    };
  }>,
  isLoading: false,
};

vi.mock("@/stores/coachStore", () => ({
  useCoachStore: () => mockStoreState,
}));

describe("InlineCoachFeedback", () => {
  beforeEach(() => {
    mockStoreState = {
      messages: [],
      isLoading: false,
    };
  });

  it("renders nothing when no messages and not loading", () => {
    const { container } = render(<InlineCoachFeedback />);
    expect(container.firstChild).toBeNull();
  });

  it("shows loading state when loading with no messages", () => {
    mockStoreState.isLoading = true;
    render(<InlineCoachFeedback />);
    expect(screen.getByText("Coach is thinking...")).toBeInTheDocument();
    expect(screen.getByTestId("inline-coach-feedback")).toBeInTheDocument();
  });

  it("shows latest coach message", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "student",
        content: "Help me",
        timestamp: 1000,
      },
      {
        id: "2",
        role: "coach",
        content: "The best move is Nf3, developing the knight toward the center.",
        timestamp: 2000,
      },
    ];
    render(<InlineCoachFeedback />);
    expect(screen.getByText("Coach")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The best move is Nf3, developing the knight toward the center."
      )
    ).toBeInTheDocument();
  });

  it("shows the LATEST coach message, not the first", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "First advice",
        timestamp: 1000,
      },
      {
        id: "2",
        role: "student",
        content: "What else?",
        timestamp: 2000,
      },
      {
        id: "3",
        role: "coach",
        content: "Second advice which is newer",
        timestamp: 3000,
      },
    ];
    render(<InlineCoachFeedback />);
    expect(
      screen.getByText("Second advice which is newer")
    ).toBeInTheDocument();
  });

  it("shows move quality badge", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "Excellent move!",
        timestamp: 1000,
        coachResponse: {
          message: "Excellent move!",
          fen: null,
          arrows: [],
          highlights: [],
          engineMove: null,
          suggestedMove: null,
          moveQuality: "brilliant",
        },
      },
    ];
    render(<InlineCoachFeedback />);
    expect(screen.getByText("brilliant")).toBeInTheDocument();
  });

  it("shows loading dots alongside message when loading", () => {
    mockStoreState.isLoading = true;
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "Previous answer",
        timestamp: 1000,
      },
    ];
    render(<InlineCoachFeedback />);
    // Should show coach message AND loading dots
    expect(screen.getByText("Previous answer")).toBeInTheDocument();
    const dots = screen.getAllByText(".");
    expect(dots.length).toBeGreaterThanOrEqual(3);
  });

  it("does not show loading text when coach message exists", () => {
    mockStoreState.isLoading = true;
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "Answer",
        timestamp: 1000,
      },
    ];
    render(<InlineCoachFeedback />);
    expect(
      screen.queryByText("Coach is thinking...")
    ).not.toBeInTheDocument();
  });

  it("renders nothing when only student messages exist and not loading", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "student",
        content: "Hello",
        timestamp: 1000,
      },
    ];
    const { container } = render(<InlineCoachFeedback />);
    expect(container.firstChild).toBeNull();
  });

  it("applies quality-specific border styling", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "Mistake!",
        timestamp: 1000,
        coachResponse: {
          message: "Mistake!",
          fen: null,
          arrows: [],
          highlights: [],
          engineMove: null,
          suggestedMove: null,
          moveQuality: "mistake",
        },
      },
    ];
    render(<InlineCoachFeedback />);
    const feedback = screen.getByTestId("inline-coach-feedback");
    const inner = feedback.firstChild as HTMLElement;
    expect(inner.className).toContain("border-orange");
  });

  it("has lg:hidden class for mobile-only display", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "Test",
        timestamp: 1000,
      },
    ];
    render(<InlineCoachFeedback />);
    const feedback = screen.getByTestId("inline-coach-feedback");
    expect(feedback.className).toContain("lg:hidden");
  });

  it("constrains width to max-w-[36rem]", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "Test",
        timestamp: 1000,
      },
    ];
    render(<InlineCoachFeedback />);
    const feedback = screen.getByTestId("inline-coach-feedback");
    expect(feedback.className).toContain("max-w-[36rem]");
  });

  it("shows no quality badge when moveQuality is null", () => {
    mockStoreState.messages = [
      {
        id: "1",
        role: "coach",
        content: "General advice",
        timestamp: 1000,
        coachResponse: {
          message: "General advice",
          fen: null,
          arrows: [],
          highlights: [],
          engineMove: null,
          suggestedMove: null,
          moveQuality: null,
        },
      },
    ];
    render(<InlineCoachFeedback />);
    expect(screen.getByText("Coach")).toBeInTheDocument();
    // No quality badge text
    expect(screen.queryByText("brilliant")).not.toBeInTheDocument();
    expect(screen.queryByText("good")).not.toBeInTheDocument();
    expect(screen.queryByText("mistake")).not.toBeInTheDocument();
  });
});
