"use client";

import type { EndgamePosition } from "@/types/endgame";
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

interface EndgameCardProps {
  position: EndgamePosition;
  onSelect: (positionId: string) => void;
  completed?: boolean;
}

const difficultyStyles: Record<EndgamePosition["difficulty"], string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const categoryLabels: Record<string, string> = {
  "king-pawn": "King + Pawn",
  "king-rook": "King + Rook",
  "king-queen": "King + Queen",
  "king-bishop": "King + Bishop",
  "king-knight": "King + Knight",
  "rook-endgame": "Rook Endgame",
  "pawn-endgame": "Pawn Endgame",
  "queen-endgame": "Queen Endgame",
};

export function EndgameCard({ position, onSelect, completed }: EndgameCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{position.name}</CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            {completed && (
              <Badge className="border-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                Completed
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {categoryLabels[position.category] ?? position.category}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={cn("border-0", difficultyStyles[position.difficulty])}>
            {position.difficulty}
          </Badge>
          <span className="text-xs text-muted-foreground">
            Play as {position.playerColor === "w" ? "White" : "Black"}
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground">{position.description}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {position.solution.length} move{position.solution.length !== 1 ? "s" : ""} in sequence
        </p>
      </CardContent>

      <CardFooter>
        <Button
          size="sm"
          className="w-full"
          onClick={() => onSelect(position.id)}
        >
          {completed ? "Practice Again" : "Start Training"}
        </Button>
      </CardFooter>
    </Card>
  );
}
