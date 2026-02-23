import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Mock the Sheet components from radix-ui
vi.mock("@/components/ui/sheet", () => ({
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTrigger: ({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) => (
    <div data-testid="sheet-trigger">{children}</div>
  ),
  SheetContent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="sheet-content">{children}</div>
  ),
  SheetHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SheetTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ChatPanel
vi.mock("./ChatPanel", () => ({
  ChatPanel: () => <div data-testid="chat-panel">Chat Panel</div>,
}));

import { MobileChatDrawer } from "./MobileChatDrawer";

describe("MobileChatDrawer", () => {
  it("renders trigger button", () => {
    render(<MobileChatDrawer />);
    const btn = screen.getByRole("button", { name: /open chat/i });
    expect(btn).toBeInTheDocument();
  });

  it("trigger button has accessible label", () => {
    render(<MobileChatDrawer />);
    const btn = screen.getByRole("button", { name: /open chat/i });
    expect(btn).toHaveAttribute("aria-label", "Open chat");
  });

  it("renders ChatPanel inside sheet content", () => {
    render(<MobileChatDrawer />);
    expect(screen.getByTestId("chat-panel")).toBeInTheDocument();
  });

  it("has sheet trigger wrapper", () => {
    render(<MobileChatDrawer />);
    expect(screen.getByTestId("sheet-trigger")).toBeInTheDocument();
  });

  it("has sheet content wrapper", () => {
    render(<MobileChatDrawer />);
    expect(screen.getByTestId("sheet-content")).toBeInTheDocument();
  });
});
