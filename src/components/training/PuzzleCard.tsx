"use client";

import type { TacticsPuzzle } from "@/types/tactics";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PuzzleCardProps {
  puzzle: TacticsPuzzle;
  onSelect: (puzzleId: string) => void;
  solved?: boolean;
}

const difficultyStyles: Record<TacticsPuzzle["difficulty"], string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const themeLabels: Record<string, string> = {
  fork: "Fork",
  pin: "Pin",
  skewer: "Skewer",
  discovery: "Discovery",
  "back-rank": "Back Rank",
  deflection: "Deflection",
  decoy: "Decoy",
  "mate-in-1": "Mate in 1",
  "mate-in-2": "Mate in 2",
  "mate-in-3": "Mate in 3",
  "trapped-piece": "Trapped Piece",
  "overloaded-piece": "Overloaded",
  zwischenzug: "Zwischenzug",
};

export function PuzzleCard({ puzzle, onSelect, solved }: PuzzleCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{puzzle.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {solved && (
              <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Solved
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {themeLabels[puzzle.theme] ?? puzzle.theme}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("border-0", difficultyStyles[puzzle.difficulty])}>
            {puzzle.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Play as {puzzle.playerColor === "w" ? "White" : "Black"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{puzzle.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {puzzle.solution.length} move{puzzle.solution.length !== 1 ? "s" : ""} to find
        </p>
      </CardContent>

      <CardFooter>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onSelect(puzzle.id)}
        >
          {solved ? "Solve Again" : "Solve Puzzle"}
        </Button>
      </CardFooter>
    </Card>
  );
}
