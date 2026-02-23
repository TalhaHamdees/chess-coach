import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MoveHistory } from "./MoveHistory";

describe("MoveHistory", () => {
  const moves = ["e4", "e5", "Nf3", "Nc6", "Bb5"];

  it("renders all moves", () => {
    render(<MoveHistory moves={moves} />);
    expect(screen.getByText("e4")).toBeInTheDocument();
    expect(screen.getByText("e5")).toBeInTheDocument();
    expect(screen.getByText("Nf3")).toBeInTheDocument();
    expect(screen.getByText("Nc6")).toBeInTheDocument();
    expect(screen.getByText("Bb5")).toBeInTheDocument();
  });

  it("shows empty state when no moves", () => {
    render(<MoveHistory moves={[]} />);
    expect(screen.getByText("No moves yet")).toBeInTheDocument();
  });

  it("calls onMoveClick with correct index when clicked", () => {
    const onClick = vi.fn();
    render(<MoveHistory moves={moves} onMoveClick={onClick} />);

    fireEvent.click(screen.getByText("e4"));
    expect(onClick).toHaveBeenCalledWith(0);

    fireEvent.click(screen.getByText("e5"));
    expect(onClick).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText("Nf3"));
    expect(onClick).toHaveBeenCalledWith(2);

    fireEvent.click(screen.getByText("Bb5"));
    expect(onClick).toHaveBeenCalledWith(4);
  });

  it("does not add cursor-pointer when onMoveClick is absent", () => {
    render(<MoveHistory moves={moves} />);
    const moveEl = screen.getByText("e4");
    expect(moveEl).not.toHaveAttribute("role", "button");
    expect(moveEl.className).not.toContain("cursor-pointer");
  });

  it("adds cursor-pointer and role=button when onMoveClick is provided", () => {
    const onClick = vi.fn();
    render(<MoveHistory moves={moves} onMoveClick={onClick} />);
    const moveEl = screen.getByText("e4");
    expect(moveEl).toHaveAttribute("role", "button");
    expect(moveEl.className).toContain("cursor-pointer");
  });
});
