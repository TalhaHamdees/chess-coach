"use client";

import { useCoachStore } from "@/stores/coachStore";
import { cn } from "@/lib/utils";

export function InlineCoachFeedback() {
  const { messages, isLoading } = useCoachStore();

  const lastCoachMessage = [...messages]
    .reverse()
    .find((m) => m.role === "coach");

  const quality = lastCoachMessage?.coachResponse?.moveQuality;

  // Nothing to show
  if (!lastCoachMessage && !isLoading) return null;

  return (
    <div className="w-full max-w-[36rem] lg:hidden" data-testid="inline-coach-feedback">
      <div
        className={cn(
          "rounded-lg border px-3 py-2",
          quality ? qualityBorder(quality) : "bg-muted/50"
        )}
      >
        {/* Loading state */}
        {isLoading && !lastCoachMessage && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="animate-bounce text-sm [animation-delay:0ms]">.</span>
              <span className="animate-bounce text-sm [animation-delay:150ms]">.</span>
              <span className="animate-bounce text-sm [animation-delay:300ms]">.</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Coach is thinking...
            </span>
          </div>
        )}

        {/* Coach message */}
        {lastCoachMessage && (
          <>
            <div className="mb-0.5 flex items-center gap-2">
              <span className="text-[10px] font-semibold text-muted-foreground">
                Coach
              </span>
              {quality && (
                <span
                  className={cn(
                    "rounded px-1 py-0.5 text-[10px] font-medium leading-none",
                    qualityBadge(quality)
                  )}
                >
                  {quality}
                </span>
              )}
              {isLoading && (
                <span className="flex items-center gap-0.5">
                  <span className="animate-bounce text-xs text-muted-foreground [animation-delay:0ms]">.</span>
                  <span className="animate-bounce text-xs text-muted-foreground [animation-delay:150ms]">.</span>
                  <span className="animate-bounce text-xs text-muted-foreground [animation-delay:300ms]">.</span>
                </span>
              )}
            </div>
            <p className="line-clamp-3 text-xs text-foreground">
              {lastCoachMessage.content}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function qualityBorder(quality: string): string {
  switch (quality) {
    case "brilliant":
      return "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950";
    case "good":
      return "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950";
    case "inaccuracy":
      return "border-yellow-300 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-950";
    case "mistake":
      return "border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950";
    case "blunder":
      return "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950";
    default:
      return "bg-muted/50";
  }
}

function qualityBadge(quality: string): string {
  switch (quality) {
    case "brilliant":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200";
    case "good":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "inaccuracy":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "mistake":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "blunder":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}
