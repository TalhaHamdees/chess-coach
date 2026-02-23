import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { OpeningCard } from "./OpeningCard";
import { useProgressStore } from "@/stores/progressStore";
import type { Opening } from "@/types/opening";

function makeOpening(overrides: Partial<Opening> = {}): Opening {
  return {
    id: "italian-game",
    name: "Italian Game",
    eco: "C50",
    category: "e4",
    difficulty: "beginner",
    description: "One of the oldest openings in chess.",
    keyIdeas: ["Rapid development", "Pressure on f7"],
    playerColor: "w",
    startingFen:
      "r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3",
    variations: [
      {
        id: "giuoco-piano",
        name: "Giuoco Piano",
        moves: [],
        finalFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      },
      {
        id: "two-knights",
        name: "Two Knights Defense",
        moves: [],
        finalFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      },
    ],
    ...overrides,
  };
}

describe("OpeningCard", () => {
  beforeEach(() => {
    useProgressStore.setState({
      variations: {},
      streakDays: 0,
      lastActiveDate: "",
      hydrated: true,
    });
  });

  it("renders the opening name", () => {
    render(<OpeningCard opening={makeOpening()} onSelect={() => {}} />);
    expect(screen.getByText("Italian Game")).toBeInTheDocument();
  });

  it("renders the ECO code", () => {
    render(<OpeningCard opening={makeOpening()} onSelect={() => {}} />);
    expect(screen.getByText("C50")).toBeInTheDocument();
  });

  it("renders the difficulty badge", () => {
    render(<OpeningCard opening={makeOpening()} onSelect={() => {}} />);
    expect(screen.getByText("beginner")).toBeInTheDocument();
  });

  it("renders the description", () => {
    render(<OpeningCard opening={makeOpening()} onSelect={() => {}} />);
    expect(
      screen.getByText("One of the oldest openings in chess.")
    ).toBeInTheDocument();
  });

  it("shows player color as White", () => {
    render(
      <OpeningCard opening={makeOpening({ playerColor: "w" })} onSelect={() => {}} />
    );
    expect(screen.getByText(/Play as White/)).toBeInTheDocument();
  });

  it("shows player color as Black", () => {
    render(
      <OpeningCard opening={makeOpening({ playerColor: "b" })} onSelect={() => {}} />
    );
    expect(screen.getByText(/Play as Black/)).toBeInTheDocument();
  });

  it("shows variation count", () => {
    render(<OpeningCard opening={makeOpening()} onSelect={() => {}} />);
    expect(screen.getByText("2 variations")).toBeInTheDocument();
  });

  it("shows singular 'variation' when there is only one", () => {
    const opening = makeOpening({
      variations: [
        {
          id: "main",
          name: "Main Line",
          moves: [],
          finalFen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        },
      ],
    });
    render(<OpeningCard opening={opening} onSelect={() => {}} />);
    expect(screen.getByText("1 variation")).toBeInTheDocument();
  });

  it("calls onSelect with the opening ID when Start Training is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    render(<OpeningCard opening={makeOpening()} onSelect={handleSelect} />);

    await user.click(screen.getByRole("button", { name: /Start Training/i }));
    expect(handleSelect).toHaveBeenCalledWith("italian-game");
  });

  it("shows 'due' badge when dueReviewCount > 0", () => {
    render(
      <OpeningCard
        opening={makeOpening()}
        onSelect={() => {}}
        dueReviewCount={3}
      />
    );
    expect(screen.getByText("3 due")).toBeInTheDocument();
  });

  it("shows 'Review Now' button text when reviews are due", () => {
    render(
      <OpeningCard
        opening={makeOpening()}
        onSelect={() => {}}
        dueReviewCount={2}
      />
    );
    expect(
      screen.getByRole("button", { name: /Review Now/i })
    ).toBeInTheDocument();
  });

  it("shows 'Start Training' when no reviews are due", () => {
    render(
      <OpeningCard
        opening={makeOpening()}
        onSelect={() => {}}
        dueReviewCount={0}
      />
    );
    expect(
      screen.getByRole("button", { name: /Start Training/i })
    ).toBeInTheDocument();
  });
});
