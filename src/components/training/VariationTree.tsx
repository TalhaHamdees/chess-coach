"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OpeningVariation } from "@/types/opening";

interface VariationTreeProps {
  variations: OpeningVariation[];
  activeVariationId: string | null;
  completedVariations: Record<string, boolean>;
  onSelectVariation: (variationId: string) => void;
}

export function VariationTree({
  variations,
  activeVariationId,
  completedVariations,
  onSelectVariation,
}: VariationTreeProps) {
  return (
    <div className="space-y-1.5">
      {variations.map((variation) => {
        const isActive = variation.id === activeVariationId;
        const isCompleted = completedVariations[variation.id] === true;

        return (
          <Button
            key={variation.id}
            variant={isActive ? "secondary" : "ghost"}
            className={cn(
              "flex w-full items-center justify-between gap-2 px-3 py-2 h-auto",
              isActive && "ring-1 ring-primary/30"
            )}
            onClick={() => onSelectVariation(variation.id)}
          >
            <div className="flex items-center gap-2 min-w-0">
              {isCompleted ? (
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-600"
                  aria-label="Completed"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="size-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              ) : (
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full border-2 border-muted-foreground/30"
                  aria-label="Not completed"
                />
              )}
              <span className="truncate text-sm font-medium">
                {variation.name}
              </span>
            </div>
            <Badge variant="outline" className="shrink-0 text-xs font-mono">
              {variation.moves.length} moves
            </Badge>
          </Button>
        );
      })}
    </div>
  );
}
