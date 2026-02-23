import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MobileChatLayout } from "./MobileChatLayout";

// Mock coachStore
const mockSendMessage = vi.fn();
const mockDismissError = vi.fn();

let mockStoreState = {
  messages: [] as Array<{
    id: string;
    role: "student" | "coach";
    content: string;
    timestamp: number;
  }>,
  isLoading: false,
  error: null as string | null,
  sendMessage: mockSendMessage,
  dismissError: mockDismissError,
};

vi.mock("@/stores/coachStore", () => ({
  useCoachStore: () => mockStoreState,
}));

// Mock ChatMessage
vi.mock("./ChatMessage", () => ({
  ChatMessage: ({ message }: { message: { id: string; content: string } }) => (
    <div data-testid={`chat-message-${message.id}`}>{message.content}</div>
  ),
}));

// Mock SuggestedPrompts
vi.mock("./SuggestedPrompts", () => ({
  SuggestedPrompts: ({
    onSelect,
    disabled,
  }: {
    onSelect: (p: string) => void;
    disabled?: boolean;
  }) => (
    <div data-testid="suggested-prompts">
      <button
        onClick={() => onSelect("Test prompt")}
        disabled={disabled}
        data-testid="prompt-button"
      >
        Test prompt
      </button>
    </div>
  ),
}));

describe("MobileChatLayout", () => {
  beforeEach(() => {
    mockStoreState = {
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      dismissError: mockDismissError,
    };
    vi.clearAllMocks();
  });

  describe("Collapsed mode (input bar)", () => {
    it("renders input field", () => {
      render(<MobileChatLayout />);
      expect(
        screen.getByPlaceholderText("Ask your coach...")
      ).toBeInTheDocument();
    });

    it("renders expand button", () => {
      render(<MobileChatLayout />);
      expect(
        screen.getByRole("button", { name: /expand chat/i })
      ).toBeInTheDocument();
    });

    it("shows error message", () => {
      mockStoreState.error = "Connection failed";
      render(<MobileChatLayout />);
      expect(screen.getByText("Connection failed")).toBeInTheDocument();
    });

    it("dismisses error on click", () => {
      mockStoreState.error = "Connection failed";
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /dismiss error/i })
      );
      expect(mockDismissError).toHaveBeenCalled();
    });

    it("sends message on Enter key", () => {
      render(<MobileChatLayout />);
      const input = screen.getByPlaceholderText("Ask your coach...");
      fireEvent.change(input, { target: { value: "Help me" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(mockSendMessage).toHaveBeenCalledWith("Help me");
    });

    it("does not send on Shift+Enter", () => {
      render(<MobileChatLayout />);
      const input = screen.getByPlaceholderText("Ask your coach...");
      fireEvent.change(input, { target: { value: "Help me" } });
      fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("does not send empty message", () => {
      render(<MobileChatLayout />);
      const input = screen.getByPlaceholderText("Ask your coach...");
      fireEvent.change(input, { target: { value: "   " } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("clears input after sending", () => {
      render(<MobileChatLayout />);
      const input = screen.getByPlaceholderText(
        "Ask your coach..."
      ) as HTMLInputElement;
      fireEvent.change(input, { target: { value: "Help me" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(input.value).toBe("");
    });

    it("disables input when loading", () => {
      mockStoreState.isLoading = true;
      render(<MobileChatLayout />);
      const input = screen.getByPlaceholderText("Ask your coach...");
      expect(input).toBeDisabled();
    });
  });

  describe("Expanded mode", () => {
    it("expands when expand button is clicked", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(
        screen.getByRole("dialog", { name: /coach chat/i })
      ).toBeInTheDocument();
    });

    it("shows Coach Chat title in expanded mode", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(screen.getByText("Coach Chat")).toBeInTheDocument();
    });

    it("shows minimize button in expanded mode", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(
        screen.getByRole("button", { name: /minimize chat/i })
      ).toBeInTheDocument();
    });

    it("collapses when minimize button is clicked", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      fireEvent.click(
        screen.getByRole("button", { name: /minimize chat/i })
      );
      expect(
        screen.queryByRole("dialog", { name: /coach chat/i })
      ).not.toBeInTheDocument();
    });

    it("shows empty state when no messages", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(
        screen.getByText("Your personal chess coach")
      ).toBeInTheDocument();
    });

    it("renders all messages in expanded mode", () => {
      mockStoreState.messages = [
        {
          id: "1",
          role: "student",
          content: "What's the best move?",
          timestamp: 1000,
        },
        {
          id: "2",
          role: "coach",
          content: "Try Nf3.",
          timestamp: 2000,
        },
        {
          id: "3",
          role: "student",
          content: "Why?",
          timestamp: 3000,
        },
      ];
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(screen.getByTestId("chat-message-1")).toBeInTheDocument();
      expect(screen.getByTestId("chat-message-2")).toBeInTheDocument();
      expect(screen.getByTestId("chat-message-3")).toBeInTheDocument();
    });

    it("shows loading indicator in expanded mode", () => {
      mockStoreState.isLoading = true;
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      const dots = screen.getAllByText(".");
      expect(dots.length).toBeGreaterThanOrEqual(3);
    });

    it("shows error in expanded mode", () => {
      mockStoreState.error = "Server error";
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });

    it("shows suggested prompts in expanded mode", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(screen.getByTestId("suggested-prompts")).toBeInTheDocument();
    });

    it("sends message via suggested prompt", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      fireEvent.click(screen.getByTestId("prompt-button"));
      expect(mockSendMessage).toHaveBeenCalledWith("Test prompt");
    });

    it("sends message via input in expanded mode", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      const input = screen.getByPlaceholderText("Ask your coach...");
      fireEvent.change(input, { target: { value: "Analyze this" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(mockSendMessage).toHaveBeenCalledWith("Analyze this");
    });

    it("has dialog role with accessible name", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-label", "Coach Chat");
    });
  });

  describe("Suggestions visibility", () => {
    it("shows suggestions when no messages", () => {
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(screen.getByTestId("suggested-prompts")).toBeInTheDocument();
    });

    it("shows suggestions when last message is from coach", () => {
      mockStoreState.messages = [
        {
          id: "1",
          role: "coach",
          content: "Here to help!",
          timestamp: 1000,
        },
      ];
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(screen.getByTestId("suggested-prompts")).toBeInTheDocument();
    });

    it("hides suggestions when loading", () => {
      mockStoreState.isLoading = true;
      mockStoreState.messages = [
        {
          id: "1",
          role: "student",
          content: "Help",
          timestamp: 1000,
        },
      ];
      render(<MobileChatLayout />);
      fireEvent.click(
        screen.getByRole("button", { name: /expand chat/i })
      );
      expect(
        screen.queryByTestId("suggested-prompts")
      ).not.toBeInTheDocument();
    });
  });
});
