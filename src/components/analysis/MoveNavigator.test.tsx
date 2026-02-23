import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MoveNavigator } from "./MoveNavigator";
import { useGameStore } from "@/stores/gameStore";
import type { ParsedGame } from "@/types/chess";

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const mockGame: ParsedGame = {
  headers: {},
  moves: [
    { fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1", san: "e4", from: "e2", to: "e4" },
    { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", san: "e5", from: "e7", to: "e5" },
    { fen: "rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2", san: "Nf3", from: "g1", to: "f3" },
  ],
  startingFen: STARTING_FEN,
  result: null,
};

describe("MoveNavigator", () => {
  beforeEach(() => {
    useGameStore.getState().reset();
  });

  it("does not render when not navigating", () => {
    const { container } = render(<MoveNavigator />);
    expect(container.innerHTML).toBe("");
  });

  it("renders 4 buttons when navigating", () => {
    useGameStore.getState().loadGame(mockGame);
    render(<MoveNavigator />);
    expect(screen.getByLabelText("Go to start")).toBeInTheDocument();
    expect(screen.getByLabelText("Go back")).toBeInTheDocument();
    expect(screen.getByLabelText("Go forward")).toBeInTheDocument();
    expect(screen.getByLabelText("Go to end")).toBeInTheDocument();
  });

  it("disables back buttons at start position", () => {
    useGameStore.getState().loadGame(mockGame);
    render(<MoveNavigator />);
    expect(screen.getByLabelText("Go to start")).toBeDisabled();
    expect(screen.getByLabelText("Go back")).toBeDisabled();
    expect(screen.getByLabelText("Go forward")).not.toBeDisabled();
    expect(screen.getByLabelText("Go to end")).not.toBeDisabled();
  });

  it("disables forward buttons at end position", () => {
    useGameStore.getState().loadGame(mockGame);
    useGameStore.getState().goToEnd();
    render(<MoveNavigator />);
    expect(screen.getByLabelText("Go to start")).not.toBeDisabled();
    expect(screen.getByLabelText("Go back")).not.toBeDisabled();
    expect(screen.getByLabelText("Go forward")).toBeDisabled();
    expect(screen.getByLabelText("Go to end")).toBeDisabled();
  });

  it("forward button advances position", () => {
    useGameStore.getState().loadGame(mockGame);
    render(<MoveNavigator />);
    fireEvent.click(screen.getByLabelText("Go forward"));
    expect(useGameStore.getState().currentPositionIndex).toBe(0);
  });

  it("back button goes back", () => {
    useGameStore.getState().loadGame(mockGame);
    useGameStore.getState().goToEnd();
    render(<MoveNavigator />);
    fireEvent.click(screen.getByLabelText("Go back"));
    expect(useGameStore.getState().currentPositionIndex).toBe(1);
  });
});
