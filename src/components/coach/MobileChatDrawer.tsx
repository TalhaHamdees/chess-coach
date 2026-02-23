"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ChatPanel } from "./ChatPanel";

export function MobileChatDrawer() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="icon"
          className="fixed bottom-4 right-4 z-50 size-12 rounded-full shadow-lg lg:hidden"
          aria-label="Open chat"
        >
          <MessageSquare className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] p-0">
        <SheetHeader className="sr-only">
          <SheetTitle>Coach Chat</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col pt-2">
          <ChatPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
