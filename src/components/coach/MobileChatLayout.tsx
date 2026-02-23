"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronUp, ChevronDown, Send, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessage } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { useCoachStore } from "@/stores/coachStore";

export function MobileChatLayout() {
  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const { messages, isLoading, error, sendMessage, dismissError } =
    useCoachStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll in expanded mode
  useEffect(() => {
    if (expanded && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, expanded]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    setInput("");
    sendMessage(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptSelect = (prompt: string) => {
    if (isLoading) return;
    sendMessage(prompt);
  };

  const showSuggestions =
    messages.length === 0 ||
    (!isLoading &&
      messages.length > 0 &&
      messages[messages.length - 1].role === "coach");

  // Expanded mode: full-screen overlay
  if (expanded) {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col bg-background lg:hidden"
        role="dialog"
        aria-label="Coach Chat"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b px-4 py-2">
          <span className="text-sm font-semibold text-foreground">
            Coach Chat
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(false)}
            aria-label="Minimize chat"
            className="size-8"
          >
            <ChevronDown className="size-4" />
          </Button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 text-4xl">&#9816;</div>
                <p className="text-sm font-medium text-foreground">
                  Your personal chess coach
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ask about your position, get move suggestions, or learn new
                  concepts.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
                  <span className="animate-bounce text-lg [animation-delay:0ms]">
                    .
                  </span>
                  <span className="animate-bounce text-lg [animation-delay:150ms]">
                    .
                  </span>
                  <span className="animate-bounce text-lg [animation-delay:300ms]">
                    .
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col gap-2 border-t px-4 py-3">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <span className="flex-1">{error}</span>
              <button
                onClick={dismissError}
                className="shrink-0 text-destructive hover:text-destructive/80"
                aria-label="Dismiss error"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {showSuggestions && (
            <SuggestedPrompts
              onSelect={handlePromptSelect}
              disabled={isLoading}
            />
          )}

          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your coach..."
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Collapsed mode: input bar at bottom
  return (
    <div className="shrink-0 border-t bg-background lg:hidden">
      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-1.5">
          <span className="flex-1 truncate text-xs text-destructive">
            {error}
          </span>
          <button
            onClick={dismissError}
            className="shrink-0"
            aria-label="Dismiss error"
          >
            <X className="size-3 text-destructive" />
          </button>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2 px-4 py-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask your coach..."
          disabled={isLoading}
          className="h-9 text-sm"
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          size="icon"
          className="size-9 shrink-0"
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0"
          onClick={() => setExpanded(true)}
          aria-label="Expand chat"
        >
          <ChevronUp className="size-4" />
        </Button>
      </div>
    </div>
  );
}
