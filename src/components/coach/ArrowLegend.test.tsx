import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArrowLegend } from "./ArrowLegend";
import type { Arrow } from "@/types/chess";

describe("ArrowLegend", () => {
  it("renders nothing when arrows array is empty", () => {
    const { container } = render(<ArrowLegend arrows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a legend entry for each arrow", () => {
    const arrows: Arrow[] = [
      { from: "e2", to: "e4", color: "green" },
      { from: "d2", to: "d4", color: "blue" },
    ];
    render(<ArrowLegend arrows={arrows} />);

    expect(screen.getByTestId("arrow-legend")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows from→to notation for each arrow", () => {
    const arrows: Arrow[] = [
      { from: "e2", to: "e4", color: "green" },
    ];
    render(<ArrowLegend arrows={arrows} />);

    // The arrow notation uses → HTML entity
    expect(screen.getByText(/e2/)).toBeInTheDocument();
    expect(screen.getByText(/e4/)).toBeInTheDocument();
  });

  it("shows color labels", () => {
    const arrows: Arrow[] = [
      { from: "e2", to: "e4", color: "green" },
      { from: "d7", to: "d5", color: "red" },
      { from: "g1", to: "f3", color: "blue" },
      { from: "f1", to: "c4", color: "yellow" },
      { from: "b8", to: "c6", color: "orange" },
    ];
    render(<ArrowLegend arrows={arrows} />);

    expect(screen.getByText("recommended")).toBeInTheDocument();
    expect(screen.getByText("danger")).toBeInTheDocument();
    expect(screen.getByText("alternative")).toBeInTheDocument();
    expect(screen.getByText("key square")).toBeInTheDocument();
    expect(screen.getByText("threat")).toBeInTheDocument();
  });

  it("applies correct color classes to number badges", () => {
    const arrows: Arrow[] = [
      { from: "e2", to: "e4", color: "green" },
      { from: "d2", to: "d4", color: "red" },
    ];
    render(<ArrowLegend arrows={arrows} />);

    const badge1 = screen.getByText("1");
    const badge2 = screen.getByText("2");

    expect(badge1.className).toContain("bg-green-500");
    expect(badge2.className).toContain("bg-red-500");
  });

  it("numbers arrows sequentially starting from 1", () => {
    const arrows: Arrow[] = [
      { from: "a1", to: "a8", color: "green" },
      { from: "b1", to: "b8", color: "blue" },
      { from: "c1", to: "c8", color: "orange" },
    ];
    render(<ArrowLegend arrows={arrows} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
