import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ChessBoard } from "./ChessBoard";
import { DEFAULT_POSITION } from "@/lib/chess/engine";

// Mock ResizeObserver for jsdom
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

describe("ChessBoard", () => {
  it("renders 64 squares", () => {
    render(<ChessBoard fen={STARTING_FEN} />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(64);
  });

  it("renders the board grid", () => {
    render(<ChessBoard fen={STARTING_FEN} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
    expect(screen.getByLabelText("Chess board")).toBeInTheDocument();
  });

  it("renders white pieces on correct starting squares", () => {
    render(<ChessBoard fen={STARTING_FEN} />);

    // White rook on a1
    expect(screen.getByLabelText("a1 white r")).toBeInTheDocument();
    // White knight on b1
    expect(screen.getByLabelText("b1 white n")).toBeInTheDocument();
    // White bishop on c1
    expect(screen.getByLabelText("c1 white b")).toBeInTheDocument();
    // White queen on d1
    expect(screen.getByLabelText("d1 white q")).toBeInTheDocument();
    // White king on e1
    expect(screen.getByLabelText("e1 white k")).toBeInTheDocument();
    // White pawns on rank 2
    expect(screen.getByLabelText("e2 white p")).toBeInTheDocument();
  });

  it("renders black pieces on correct starting squares", () => {
    render(<ChessBoard fen={STARTING_FEN} />);

    // Black rook on a8
    expect(screen.getByLabelText("a8 black r")).toBeInTheDocument();
    // Black king on e8
    expect(screen.getByLabelText("e8 black k")).toBeInTheDocument();
    // Black pawns on rank 7
    expect(screen.getByLabelText("e7 black p")).toBeInTheDocument();
  });

  it("renders empty squares without piece labels", () => {
    render(<ChessBoard fen={STARTING_FEN} />);

    // e4 should be empty in starting position
    expect(screen.getByLabelText("e4")).toBeInTheDocument();
    expect(screen.queryByLabelText(/e4 .+/)).not.toBeInTheDocument();
  });

  it("calls onSquareClick when a square is clicked", () => {
    const handleClick = vi.fn();
    render(<ChessBoard fen={STARTING_FEN} onSquareClick={handleClick} />);

    fireEvent.click(screen.getByLabelText("e2 white p"));
    expect(handleClick).toHaveBeenCalledWith("e2");
  });

  it("calls onSquareClick with correct square for empty squares", () => {
    const handleClick = vi.fn();
    render(<ChessBoard fen={STARTING_FEN} onSquareClick={handleClick} />);

    fireEvent.click(screen.getByLabelText("e4"));
    expect(handleClick).toHaveBeenCalledWith("e4");
  });

  it("does not call onSquareClick when interactive=false", () => {
    const handleClick = vi.fn();
    render(
      <ChessBoard
        fen={STARTING_FEN}
        onSquareClick={handleClick}
        interactive={false}
      />
    );

    fireEvent.click(screen.getByLabelText("e2 white p"));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it("highlights selected square", () => {
    render(<ChessBoard fen={STARTING_FEN} selectedSquare="e2" />);

    const e2 = screen.getByLabelText("e2 white p");
    expect(e2.className).toContain("bg-yellow-400");
  });

  it("shows valid move dots for move targets", () => {
    const { container } = render(
      <ChessBoard
        fen={STARTING_FEN}
        selectedSquare="e2"
        validMoveTargets={["e3", "e4"]}
      />
    );

    // Valid move targets on empty squares should have dot indicators
    const e3 = container.querySelector('[data-square="e3"]');
    const e4 = container.querySelector('[data-square="e4"]');
    expect(e3?.querySelector(".rounded-full")).toBeTruthy();
    expect(e4?.querySelector(".rounded-full")).toBeTruthy();
  });

  it("highlights last move squares", () => {
    render(
      <ChessBoard
        fen="rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
        lastMove={{ from: "e2", to: "e4" }}
      />
    );

    const e2 = screen.getByLabelText("e2");
    const e4 = screen.getByLabelText("e4 white p");
    // Both should have last-move highlighting (yellow)
    expect(e2.className).toContain("bg-yellow");
    expect(e4.className).toContain("bg-yellow");
  });

  it("renders coordinate labels on correct edges", () => {
    const { container } = render(<ChessBoard fen={STARTING_FEN} />);

    // File labels on rank 1 (bottom when not flipped)
    const a1 = container.querySelector('[data-square="a1"]');
    expect(a1?.textContent).toContain("a");

    // Rank labels on file a (left when not flipped)
    expect(a1?.textContent).toContain("1");
  });

  it("flips board when flipped=true", () => {
    const { container } = render(
      <ChessBoard fen={STARTING_FEN} flipped={true} />
    );

    // When flipped, the first gridcell should be h1 (bottom-right becomes top-left)
    const cells = container.querySelectorAll('[role="gridcell"]');
    expect(cells[0].getAttribute("data-square")).toBe("h1");
    expect(cells[63].getAttribute("data-square")).toBe("a8");
  });

  it("renders correct square order when not flipped", () => {
    const { container } = render(<ChessBoard fen={STARTING_FEN} />);

    const cells = container.querySelectorAll('[role="gridcell"]');
    // First cell is a8 (top-left), last is h1 (bottom-right)
    expect(cells[0].getAttribute("data-square")).toBe("a8");
    expect(cells[63].getAttribute("data-square")).toBe("h1");
  });

  it("renders custom FEN position correctly", () => {
    // Position with only kings
    const kingsOnlyFen = "4k3/8/8/8/8/8/8/4K3 w - - 0 1";
    render(<ChessBoard fen={kingsOnlyFen} />);

    expect(screen.getByLabelText("e8 black k")).toBeInTheDocument();
    expect(screen.getByLabelText("e1 white k")).toBeInTheDocument();

    // No pawns should exist
    expect(screen.queryByLabelText(/white p/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/black p/)).not.toBeInTheDocument();
  });

  it("falls back to starting position on invalid FEN", () => {
    render(<ChessBoard fen="invalid-fen-string" />);

    // Should render default starting position
    expect(screen.getByLabelText("e1 white k")).toBeInTheDocument();
    expect(screen.getByLabelText("e8 black k")).toBeInTheDocument();
    expect(screen.getAllByRole("gridcell")).toHaveLength(64);
  });

  it("renders capture indicator on occupied valid target squares", () => {
    // Position where white pawn on e4 can capture black pawn on d5
    const fen = "rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2";
    const { container } = render(
      <ChessBoard
        fen={fen}
        selectedSquare="e4"
        validMoveTargets={["e5", "d5"]}
      />
    );

    // d5 has a piece, so it should have capture indicator (border ring)
    const d5 = container.querySelector('[data-square="d5"]');
    expect(d5?.querySelector(".border-green-600\\/60")).toBeTruthy();

    // e5 is empty, so it should have a dot
    const e5 = container.querySelector('[data-square="e5"]');
    expect(e5?.querySelector(".rounded-full:not(.border-green-600\\/60)")).toBeTruthy();
  });
});
