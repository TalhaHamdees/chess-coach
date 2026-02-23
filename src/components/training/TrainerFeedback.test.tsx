import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { TrainerFeedback } from "./TrainerFeedback";
import type { TrainerStatus } from "@/stores/openingTrainerStore";

function renderFeedback(overrides: Partial<Parameters<typeof TrainerFeedback>[0]> = {}) {
  const defaults = {
    status: "idle" as TrainerStatus,
    currentMoveIndex: 0,
    totalMoves: 6,
    annotation: null,
    wrongAttempts: 0,
    playerColor: "w" as const,
    onRetry: vi.fn(),
    onHint: vi.fn(),
  };
  const props = { ...defaults, ...overrides };
  return { ...render(<TrainerFeedback {...props} />), props };
}

describe("TrainerFeedback", () => {
  it("shows idle message when status is idle", () => {
    renderFeedback({ status: "idle" });
    expect(screen.getByText("Select a variation to start practicing")).toBeInTheDocument();
  });

  it("shows playing message when status is playing", () => {
    renderFeedback({ status: "playing" });
    expect(screen.getByText("Your turn — find the correct move")).toBeInTheDocument();
  });

  it("shows opponent moving message", () => {
    renderFeedback({ status: "opponent-moving" });
    expect(screen.getByText("Opponent is playing...")).toBeInTheDocument();
  });

  it("shows wrong move message", () => {
    renderFeedback({ status: "wrong-move" });
    expect(screen.getByText("Not quite — try again!")).toBeInTheDocument();
  });

  it("shows completed message", () => {
    renderFeedback({ status: "completed" });
    expect(screen.getByText("Variation completed!")).toBeInTheDocument();
  });

  it("shows progress text when active", () => {
    renderFeedback({ status: "playing", currentMoveIndex: 2, totalMoves: 6 });
    expect(screen.getByText("Move 3 of 6")).toBeInTheDocument();
  });

  it("does not show progress when idle", () => {
    renderFeedback({ status: "idle", currentMoveIndex: 0, totalMoves: 6 });
    expect(screen.queryByText(/Move \d+ of \d+/)).not.toBeInTheDocument();
  });

  it("shows annotation when provided", () => {
    renderFeedback({ status: "playing", annotation: "Control the center!" });
    expect(screen.getByText("Control the center!")).toBeInTheDocument();
  });

  it("shows wrong attempts counter", () => {
    renderFeedback({ status: "playing", wrongAttempts: 2 });
    expect(screen.getByText("Wrong attempts: 2")).toBeInTheDocument();
  });

  it("does not show wrong attempts when zero", () => {
    renderFeedback({ status: "playing", wrongAttempts: 0 });
    expect(screen.queryByText(/Wrong attempts/)).not.toBeInTheDocument();
  });

  it("calls onRetry when Retry button is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderFeedback({ status: "playing" });

    await user.click(screen.getByRole("button", { name: /Retry/i }));
    expect(props.onRetry).toHaveBeenCalledOnce();
  });

  it("calls onHint when Hint button is clicked", async () => {
    const user = userEvent.setup();
    const { props } = renderFeedback({ status: "playing" });

    await user.click(screen.getByRole("button", { name: /Hint/i }));
    expect(props.onHint).toHaveBeenCalledOnce();
  });

  it("does not show Hint button when not playing", () => {
    renderFeedback({ status: "completed" });
    expect(screen.queryByRole("button", { name: /Hint/i })).not.toBeInTheDocument();
  });

  it("shows Retry button when active (not idle)", () => {
    renderFeedback({ status: "completed" });
    expect(screen.getByRole("button", { name: /Retry/i })).toBeInTheDocument();
  });

  it("does not show Retry button when idle", () => {
    renderFeedback({ status: "idle" });
    expect(screen.queryByRole("button", { name: /Retry/i })).not.toBeInTheDocument();
  });
});
