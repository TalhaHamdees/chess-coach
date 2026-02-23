import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { SpacedRepetition } from "./SpacedRepetition";
import { useProgressStore } from "@/stores/progressStore";

const MS_PER_DAY = 86_400_000;

describe("SpacedRepetition", () => {
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

  it("shows message when no progress exists", () => {
    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(
      screen.getByText("Complete this variation to start tracking progress.")
    ).toBeInTheDocument();
  });

  it("shows repetition count", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + MS_PER_DAY,
          easeFactor: 2.6,
          interval: 1,
          repetitions: 3,
        },
      },
    });

    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("shows ease factor", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + MS_PER_DAY,
          easeFactor: 2.6,
          interval: 1,
          repetitions: 1,
        },
      },
    });

    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(screen.getByText("2.60")).toBeInTheDocument();
  });

  it("shows interval in days", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + 6 * MS_PER_DAY,
          easeFactor: 2.5,
          interval: 6,
          repetitions: 2,
        },
      },
    });

    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(screen.getByText("6 days")).toBeInTheDocument();
  });

  it("shows streak when > 0", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + MS_PER_DAY,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        },
      },
      streakDays: 5,
    });

    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(screen.getByText("5 days")).toBeInTheDocument();
    expect(screen.getByText("Streak")).toBeInTheDocument();
  });

  it("shows due review count when reviews are due", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now() - 2 * MS_PER_DAY,
          nextReview: Date.now() - MS_PER_DAY, // overdue
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        },
        "italian-game:two-knights": {
          openingId: "italian-game",
          variationId: "two-knights",
          completedMoves: 4,
          totalMoves: 4,
          lastPracticed: Date.now() - 2 * MS_PER_DAY,
          nextReview: Date.now() - MS_PER_DAY, // overdue
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        },
      },
    });

    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(screen.getByText("2 variations due for review")).toBeInTheDocument();
  });

  it("shows next review date", () => {
    useProgressStore.setState({
      variations: {
        "italian-game:giuoco-piano": {
          openingId: "italian-game",
          variationId: "giuoco-piano",
          completedMoves: 6,
          totalMoves: 6,
          lastPracticed: Date.now(),
          nextReview: Date.now() + MS_PER_DAY,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 1,
        },
      },
    });

    render(<SpacedRepetition openingId="italian-game" variationId="giuoco-piano" />);
    expect(screen.getByText("Tomorrow")).toBeInTheDocument();
  });
});
