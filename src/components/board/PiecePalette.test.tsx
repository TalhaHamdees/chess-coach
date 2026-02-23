import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { PiecePalette } from "./PiecePalette";
import type { Piece } from "@/types/chess";

describe("PiecePalette", () => {
  it("renders all 12 pieces", () => {
    render(<PiecePalette selectedPiece={null} onSelectPiece={() => {}} />);
    // 6 white pieces + 6 black pieces = 12 piece buttons + 1 eraser = 13 buttons
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(13);
  });

  it("renders piece images for white and black", () => {
    render(<PiecePalette selectedPiece={null} onSelectPiece={() => {}} />);
    // Should have labels for all pieces
    expect(screen.getByLabelText("white k")).toBeInTheDocument();
    expect(screen.getByLabelText("white q")).toBeInTheDocument();
    expect(screen.getByLabelText("white r")).toBeInTheDocument();
    expect(screen.getByLabelText("white b")).toBeInTheDocument();
    expect(screen.getByLabelText("white n")).toBeInTheDocument();
    expect(screen.getByLabelText("white p")).toBeInTheDocument();
    expect(screen.getByLabelText("black k")).toBeInTheDocument();
    expect(screen.getByLabelText("black q")).toBeInTheDocument();
    expect(screen.getByLabelText("black r")).toBeInTheDocument();
    expect(screen.getByLabelText("black b")).toBeInTheDocument();
    expect(screen.getByLabelText("black n")).toBeInTheDocument();
    expect(screen.getByLabelText("black p")).toBeInTheDocument();
  });

  it("renders eraser button", () => {
    render(<PiecePalette selectedPiece={null} onSelectPiece={() => {}} />);
    expect(screen.getByLabelText("Eraser (remove pieces)")).toBeInTheDocument();
  });

  it("calls onSelectPiece with correct piece when clicked", () => {
    const onSelectPiece = vi.fn();
    render(<PiecePalette selectedPiece={null} onSelectPiece={onSelectPiece} />);
    fireEvent.click(screen.getByLabelText("white q"));
    expect(onSelectPiece).toHaveBeenCalledWith({ type: "q", color: "w" });
  });

  it("calls onSelectPiece with null when eraser clicked", () => {
    const onSelectPiece = vi.fn();
    const piece: Piece = { type: "q", color: "w" };
    render(<PiecePalette selectedPiece={piece} onSelectPiece={onSelectPiece} />);
    fireEvent.click(screen.getByLabelText("Eraser (remove pieces)"));
    expect(onSelectPiece).toHaveBeenCalledWith(null);
  });

  it("highlights selected piece with aria-pressed", () => {
    const piece: Piece = { type: "n", color: "b" };
    render(<PiecePalette selectedPiece={piece} onSelectPiece={() => {}} />);
    const knightBtn = screen.getByLabelText("black n");
    expect(knightBtn).toHaveAttribute("aria-pressed", "true");
    // Other pieces should not be pressed
    const queenBtn = screen.getByLabelText("white q");
    expect(queenBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("highlights eraser when selectedPiece is null", () => {
    render(<PiecePalette selectedPiece={null} onSelectPiece={() => {}} />);
    const eraser = screen.getByLabelText("Eraser (remove pieces)");
    expect(eraser).toHaveAttribute("aria-pressed", "true");
  });

  it("eraser not highlighted when a piece is selected", () => {
    const piece: Piece = { type: "k", color: "w" };
    render(<PiecePalette selectedPiece={piece} onSelectPiece={() => {}} />);
    const eraser = screen.getByLabelText("Eraser (remove pieces)");
    expect(eraser).toHaveAttribute("aria-pressed", "false");
  });

  it("clicking different pieces fires correct callbacks", () => {
    const onSelectPiece = vi.fn();
    render(<PiecePalette selectedPiece={null} onSelectPiece={onSelectPiece} />);
    fireEvent.click(screen.getByLabelText("black r"));
    expect(onSelectPiece).toHaveBeenCalledWith({ type: "r", color: "b" });
    fireEvent.click(screen.getByLabelText("white p"));
    expect(onSelectPiece).toHaveBeenCalledWith({ type: "p", color: "w" });
  });

  it("has toolbar role", () => {
    render(<PiecePalette selectedPiece={null} onSelectPiece={() => {}} />);
    expect(screen.getByRole("toolbar")).toBeInTheDocument();
  });
});
