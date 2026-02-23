import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { VariationTree } from "./VariationTree";
import type { OpeningVariation } from "@/types/opening";

function makeVariations(): OpeningVariation[] {
  return [
    {
      id: "giuoco-piano",
      name: "Giuoco Piano",
      moves: [
        { moveNumber: 3, san: "Bc5", color: "b" },
        { moveNumber: 4, san: "c3", color: "w" },
      ],
      finalFen: "test-fen-1",
    },
    {
      id: "two-knights",
      name: "Two Knights Defense",
      moves: [
        { moveNumber: 3, san: "Nf6", color: "b" },
      ],
      finalFen: "test-fen-2",
    },
  ];
}

describe("VariationTree", () => {
  it("renders all variation names", () => {
    render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId={null}
        completedVariations={{}}
        onSelectVariation={() => {}}
      />
    );

    expect(screen.getByText("Giuoco Piano")).toBeInTheDocument();
    expect(screen.getByText("Two Knights Defense")).toBeInTheDocument();
  });

  it("shows move counts for each variation", () => {
    render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId={null}
        completedVariations={{}}
        onSelectVariation={() => {}}
      />
    );

    expect(screen.getByText("2 moves")).toBeInTheDocument();
    expect(screen.getByText("1 moves")).toBeInTheDocument();
  });

  it("shows completed checkmark for completed variations", () => {
    render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId={null}
        completedVariations={{ "giuoco-piano": true }}
        onSelectVariation={() => {}}
      />
    );

    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
    expect(screen.getByLabelText("Not completed")).toBeInTheDocument();
  });

  it("shows empty circle for uncompleted variations", () => {
    render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId={null}
        completedVariations={{}}
        onSelectVariation={() => {}}
      />
    );

    const notCompleted = screen.getAllByLabelText("Not completed");
    expect(notCompleted).toHaveLength(2);
  });

  it("calls onSelectVariation when a variation is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId={null}
        completedVariations={{}}
        onSelectVariation={handleSelect}
      />
    );

    await user.click(screen.getByText("Giuoco Piano"));
    expect(handleSelect).toHaveBeenCalledWith("giuoco-piano");
  });

  it("calls onSelectVariation with correct ID for second variation", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId={null}
        completedVariations={{}}
        onSelectVariation={handleSelect}
      />
    );

    await user.click(screen.getByText("Two Knights Defense"));
    expect(handleSelect).toHaveBeenCalledWith("two-knights");
  });

  it("highlights the active variation", () => {
    const { container } = render(
      <VariationTree
        variations={makeVariations()}
        activeVariationId="giuoco-piano"
        completedVariations={{}}
        onSelectVariation={() => {}}
      />
    );

    // The active variation button should have the ring class
    const buttons = container.querySelectorAll("button");
    const activeButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes("Giuoco Piano")
    );
    expect(activeButton?.className).toContain("ring");
  });

  it("renders empty when no variations", () => {
    const { container } = render(
      <VariationTree
        variations={[]}
        activeVariationId={null}
        completedVariations={{}}
        onSelectVariation={() => {}}
      />
    );

    expect(container.querySelectorAll("button")).toHaveLength(0);
  });
});
