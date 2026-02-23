"use client";

import { useGameStore } from "@/stores/gameStore";
import { Button } from "@/components/ui/button";
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export function MoveNavigator() {
  const {
    isNavigating,
    currentPositionIndex,
    positionHistory,
    goToStart,
    goBack,
    goForward,
    goToEnd,
  } = useGameStore();

  if (!isNavigating) return null;

  const atStart = currentPositionIndex === -1;
  const atEnd = currentPositionIndex === positionHistory.length - 1;

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={goToStart}
        disabled={atStart}
        aria-label="Go to start"
      >
        <ChevronsLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={goBack}
        disabled={atStart}
        aria-label="Go back"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={goForward}
        disabled={atEnd}
        aria-label="Go forward"
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button
        variant="outline"
        size="icon-sm"
        onClick={goToEnd}
        disabled={atEnd}
        aria-label="Go to end"
      >
        <ChevronsRight className="size-4" />
      </Button>
    </div>
  );
}
