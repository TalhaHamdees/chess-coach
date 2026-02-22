"use client";

import { Button } from "@/components/ui/button";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const PROMPTS = [
  "Explain this position",
  "What's the best move?",
  "What should my plan be?",
  "Any tactics here?",
  "Evaluate my position",
];

export function SuggestedPrompts({ onSelect, disabled }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {PROMPTS.map((prompt) => (
        <Button
          key={prompt}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
