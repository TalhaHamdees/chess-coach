"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatMessage } from "./ChatMessage";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { useCoachStore } from "@/stores/coachStore";
import { Loader2, Send, X } from "lucide-react";

interface ChatPanelProps {
  variant?: "card" | "embedded";
}

export function ChatPanel({ variant = "card" }: ChatPanelProps) {
  const { messages, isLoading, error, sendMessage, dismissError } =
    useCoachStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

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

  const showSuggestions = messages.length === 0 || (!isLoading && messages.length > 0 && messages[messages.length - 1].role === "coach");

  const emptyState = (
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
  );

  const messageList = (
    <>
      {messages.length === 0 && !isLoading && emptyState}

      {messages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}

      {isLoading && (
        <div className="flex justify-start">
          <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2">
            <span className="animate-bounce text-lg [animation-delay:0ms]">.</span>
            <span className="animate-bounce text-lg [animation-delay:150ms]">.</span>
            <span className="animate-bounce text-lg [animation-delay:300ms]">.</span>
          </div>
        </div>
      )}
    </>
  );

  const errorBanner = error && (
    <div className="flex w-full items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
      <span className="flex-1">{error}</span>
      <button
        onClick={dismissError}
        className="shrink-0 text-destructive hover:text-destructive/80"
        aria-label="Dismiss error"
      >
        <X className="size-4" />
      </button>
    </div>
  );

  const inputBar = (
    <div className="flex w-full gap-2">
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Ask your coach..."
        disabled={isLoading}
        className={variant === "embedded" ? "rounded-full bg-muted/50 border-muted-foreground/20" : undefined}
      />
      <Button
        onClick={handleSend}
        disabled={!input.trim() || isLoading}
        size="icon"
        className={variant === "embedded" ? "rounded-full" : undefined}
      >
        {isLoading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Send className="size-4" />
        )}
      </Button>
    </div>
  );

  if (variant === "embedded") {
    return (
      <div className="flex h-full flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="flex flex-col gap-3 p-4">
            {messageList}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t px-4 py-3">
          {errorBanner}
          {showSuggestions && (
            <SuggestedPrompts onSelect={handlePromptSelect} disabled={isLoading} />
          )}
          {inputBar}
        </div>
      </div>
    );
  }

  return (
    <Card className="flex h-full flex-col gap-0 py-0">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-base">Coach Chat</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full">
          <div ref={scrollRef} className="flex flex-col gap-3 p-4">
            {messageList}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="flex flex-col gap-3 border-t px-4 py-3">
        {errorBanner}
        {showSuggestions && (
          <SuggestedPrompts onSelect={handlePromptSelect} disabled={isLoading} />
        )}
        {inputBar}
      </CardFooter>
    </Card>
  );
}
