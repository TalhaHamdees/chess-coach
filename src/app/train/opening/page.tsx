"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OpeningCard } from "@/components/training/OpeningCard";
import {
  OPENINGS,
  getOpeningsByCategory,
} from "@/lib/data/openings";
import type { OpeningCategory } from "@/types/opening";
import { cn } from "@/lib/utils";

type Filter = "all" | OpeningCategory;

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "1.e4", value: "e4" },
  { label: "1.d4", value: "d4" },
  { label: "Other", value: "other" },
];

export default function OpeningSelectorPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");

  const openings =
    selectedFilter === "all"
      ? OPENINGS
      : getOpeningsByCategory(selectedFilter);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => router.push("/")}
          aria-label="Back to home"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Opening Trainer
        </h1>
      </header>

      {/* Filter bar */}
      <div className="flex gap-2 border-b px-4 py-3">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={selectedFilter === filter.value ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedFilter(filter.value)}
            className={cn(
              selectedFilter === filter.value && "pointer-events-none"
            )}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Opening grid */}
      <div className="flex-1 p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {openings.map((opening) => (
            <OpeningCard
              key={opening.id}
              opening={opening}
              onSelect={(id) => router.push(`/train/opening/${id}`)}
            />
          ))}
        </div>

        {openings.length === 0 && (
          <p className="py-12 text-center text-muted-foreground">
            No openings found for this category.
          </p>
        )}
      </div>
    </div>
  );
}
