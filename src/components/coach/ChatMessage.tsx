"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage as ChatMessageType } from "@/types/coach";
import { ArrowLegend } from "./ArrowLegend";

interface ChatMessageProps {
  message: ChatMessageType;
}

const QUALITY_STYLES: Record<string, string> = {
  brilliant: "bg-emerald-100 text-emerald-800",
  good: "bg-green-100 text-green-800",
  inaccuracy: "bg-yellow-100 text-yellow-800",
  mistake: "bg-orange-100 text-orange-800",
  blunder: "bg-red-100 text-red-800",
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isCoach = message.role === "coach";
  const quality = message.coachResponse?.moveQuality;

  return (
    <div
      className={cn(
        "flex w-full",
        isCoach ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2",
          isCoach
            ? "bg-muted text-foreground"
            : "bg-primary text-primary-foreground"
        )}
      >
        {isCoach && (
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            Coach
          </div>
        )}
        <div className="whitespace-pre-wrap text-sm">{message.content}</div>
        {isCoach && message.coachResponse?.arrows && message.coachResponse.arrows.length > 0 && (
          <ArrowLegend arrows={message.coachResponse.arrows} />
        )}
        {quality && (
          <span
            className={cn(
              "mt-1 inline-block rounded px-1.5 py-0.5 text-xs font-medium",
              QUALITY_STYLES[quality]
            )}
          >
            {quality}
          </span>
        )}
      </div>
    </div>
  );
}
