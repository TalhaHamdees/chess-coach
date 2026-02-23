"use client";

import type { Opening } from "@/types/opening";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

interface OpeningCardProps {
  opening: Opening;
  onSelect: (openingId: string) => void;
  dueReviewCount?: number;
}

const difficultyStyles: Record<Opening["difficulty"], string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function OpeningCard({ opening, onSelect, dueReviewCount }: OpeningCardProps) {
  const hasDueReviews = dueReviewCount !== undefined && dueReviewCount > 0;

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{opening.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {hasDueReviews && (
              <Badge className="border-0 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                {dueReviewCount} due
              </Badge>
            )}
            <Badge variant="outline" className="font-mono text-xs">
              {opening.eco}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("border-0", difficultyStyles[opening.difficulty])}>
            {opening.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Play as {opening.playerColor === "w" ? "White" : "Black"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{opening.description}</p>
        <p className="mt-3 text-xs text-muted-foreground">
          {opening.variations.length} variation{opening.variations.length !== 1 ? "s" : ""}
        </p>
        <div className="mt-3">
          <ProgressBar
            openingId={opening.id}
            totalVariations={opening.variations.length}
          />
        </div>
      </CardContent>

      <CardFooter>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onSelect(opening.id)}
        >
          {hasDueReviews ? "Review Now" : "Start Training"}
        </Button>
      </CardFooter>
    </Card>
  );
}
