import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProgressBar } from "./ProgressBar";
import { useProgressStore } from "@/stores/progressStore";

const MS_PER_DAY = 86_400_000;

describe("ProgressBar", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-23T12:00:00Z"));
    useProgressStore.setState({
      variations: {},
      streakDays: 0,
      lastActiveDate: "",
      hydrated: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when totalVariations is 0", () => {
    const { container } = render(
      <ProgressBar openingId="italian-game" totalVariations={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows all variations as new when no progress", () => {
    render(<ProgressBar openingId="italian-game" totalVariations={3} />);
    expect(screen.getByText("0 learned, 0 due, 3 new")).toBeInTheDocument();
  });

  it("shows learned count for completed non-due variations", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + 5 * MS_PER_DAY, // Not due
          easeFactor: 2.5,
          interval: 5,
          repetitions: 2,
        },
      },
    });

    render(<ProgressBar openingId="italian-game" totalVariations={3} />);
    expect(screen.getByText("1 learned, 0 due, 2 new")).toBeInTheDocument();
  });

  it("shows due count for overdue variations", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now() - 2 * MS_PER_DAY,
          nextReview: Date.now() - MS_PER_DAY, // Due
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        },
      },
    });

    render(<ProgressBar openingId="italian-game" totalVariations={3} />);
    expect(screen.getByText("0 learned, 1 due, 2 new")).toBeInTheDocument();
  });

  it("renders the segmented bar", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + 5 * MS_PER_DAY,
          easeFactor: 2.5,
          interval: 5,
          repetitions: 2,
        },
        "italian-game:two-knights": {
          openingId: "italian-game",
          variationId: "two-knights",
          completedMoves: 4,
          totalMoves: 4,
          lastPracticed: Date.now() - 3 * MS_PER_DAY,
          nextReview: Date.now() - MS_PER_DAY,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        },
      },
    });

    render(<ProgressBar openingId="italian-game" totalVariations={3} />);

    expect(screen.getByTestId("progress-bar")).toBeInTheDocument();
    expect(screen.getByTestId("progress-learned")).toBeInTheDocument();
    expect(screen.getByTestId("progress-due")).toBeInTheDocument();
  });

  it("only counts variations matching the openingId", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + 5 * MS_PER_DAY,
          easeFactor: 2.5,
          interval: 5,
          repetitions: 2,
        },
        "sicilian:najdorf": {
          openingId: "sicilian",
          variationId: "najdorf",
          completedMoves: 8,
          totalMoves: 8,
          lastPracticed: Date.now(),
          nextReview: Date.now() + 5 * MS_PER_DAY,
          easeFactor: 2.5,
          interval: 5,
          repetitions: 2,
        },
      },
    });

    render(<ProgressBar openingId="italian-game" totalVariations={2} />);
    expect(screen.getByText("1 learned, 0 due, 1 new")).toBeInTheDocument();
  });
});
