"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCoachStore } from "@/stores/coachStore";
import { useProgressStore } from "@/stores/progressStore";
import { ChatPanel } from "@/components/coach/ChatPanel";
import { cn } from "@/lib/utils";

type StudyTime = "1-3h" | "3-5h" | "5-10h" | "10+h";
type Weakness = "openings" | "tactics" | "endgames" | "positional" | "time-management";
type TimeControl = "bullet" | "blitz" | "rapid" | "classical";

const STUDY_TIMES: { label: string; value: StudyTime }[] = [
  { label: "1-3 hours", value: "1-3h" },
  { label: "3-5 hours", value: "3-5h" },
  { label: "5-10 hours", value: "5-10h" },
  { label: "10+ hours", value: "10+h" },
];

const WEAKNESSES: { label: string; value: Weakness }[] = [
  { label: "Openings", value: "openings" },
  { label: "Tactics", value: "tactics" },
  { label: "Endgames", value: "endgames" },
  { label: "Positional Play", value: "positional" },
  { label: "Time Management", value: "time-management" },
];

const TIME_CONTROLS: { label: string; value: TimeControl }[] = [
  { label: "Bullet", value: "bullet" },
  { label: "Blitz", value: "blitz" },
  { label: "Rapid", value: "rapid" },
  { label: "Classical", value: "classical" },
];

export default function PlanPage() {
  const [currentRating, setCurrentRating] = useState("");
  const [targetRating, setTargetRating] = useState("");
  const [studyTime, setStudyTime] = useState<StudyTime>("3-5h");
  const [weaknesses, setWeaknesses] = useState<Weakness[]>([]);
  const [timeControl, setTimeControl] = useState<TimeControl>("rapid");
  const [planGenerated, setPlanGenerated] = useState(false);

  const { setMode, clearChat, sendMessage, isLoading } = useCoachStore();
  const { hydrate, getSolvedTacticsCount, streakDays } = useProgressStore();

  useEffect(() => {
    hydrate();
    setMode("planning");
    clearChat();
    return () => {
      setMode("free-play");
      clearChat();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleWeakness = (w: Weakness) => {
    setWeaknesses((prev) =>
      prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]
    );
  };

  const handleGenerate = async () => {
    const solvedTactics = getSolvedTacticsCount();
    const message = buildPlannerMessage({
      currentRating: parseInt(currentRating, 10) || 0,
      targetRating: parseInt(targetRating, 10) || 0,
      studyTime,
      weaknesses,
      timeControl,
      solvedTactics,
      streakDays,
    });
    setPlanGenerated(true);
    await sendMessage(message);
  };

  const canGenerate =
    currentRating.trim() !== "" &&
    targetRating.trim() !== "" &&
    !isLoading;

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/" aria-label="Back to home">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <GraduationCap className="size-5 text-primary" />
        <h1 className="text-lg font-bold tracking-tight text-foreground">
          Rating Improvement Plan
        </h1>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-auto">
        {/* Form section */}
        {!planGenerated && (
          <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
            <p className="text-sm text-muted-foreground">
              Tell us about your chess goals and we&apos;ll create a personalized study plan.
            </p>

            {/* Current rating */}
            <div className="space-y-2">
              <label
                htmlFor="current-rating"
                className="text-sm font-medium text-foreground"
              >
                Current Rating
              </label>
              <input
                id="current-rating"
                type="number"
                value={currentRating}
                onChange={(e) => setCurrentRating(e.target.value)}
                placeholder="e.g. 1200"
                min={0}
                max={3000}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Target rating */}
            <div className="space-y-2">
              <label
                htmlFor="target-rating"
                className="text-sm font-medium text-foreground"
              >
                Target Rating
              </label>
              <input
                id="target-rating"
                type="number"
                value={targetRating}
                onChange={(e) => setTargetRating(e.target.value)}
                placeholder="e.g. 1500"
                min={0}
                max={3000}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Study time per week */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Available Study Time (per week)
              </span>
              <div className="flex flex-wrap gap-2">
                {STUDY_TIMES.map((st) => (
                  <Button
                    key={st.value}
                    variant={studyTime === st.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStudyTime(st.value)}
                  >
                    {st.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Biggest Weaknesses (select all that apply)
              </span>
              <div className="flex flex-wrap gap-2">
                {WEAKNESSES.map((w) => (
                  <Button
                    key={w.value}
                    variant={weaknesses.includes(w.value) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleWeakness(w.value)}
                  >
                    {w.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Time control */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">
                Preferred Time Control
              </span>
              <div className="flex flex-wrap gap-2">
                {TIME_CONTROLS.map((tc) => (
                  <Button
                    key={tc.value}
                    variant={timeControl === tc.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeControl(tc.value)}
                  >
                    {tc.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <Button
              className="w-full"
              size="lg"
              onClick={handleGenerate}
              disabled={!canGenerate}
            >
              <GraduationCap className="size-4" />
              Generate Study Plan
            </Button>
          </div>
        )}

        {/* Chat section (shows after plan generated) */}
        {planGenerated && (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b px-4 py-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPlanGenerated(false);
                  clearChat();
                }}
              >
                <ArrowLeft className="size-4" />
                New Plan
              </Button>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-xs">
                  {currentRating} → {targetRating}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {studyTime}/week
                </Badge>
              </div>
            </div>
            <div className="min-h-0 flex-1 p-4">
              <ChatPanel />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function buildPlannerMessage(data: {
  currentRating: number;
  targetRating: number;
  studyTime: StudyTime;
  weaknesses: Weakness[];
  timeControl: TimeControl;
  solvedTactics: number;
  streakDays: number;
}): string {
  const lines: string[] = [
    `I'd like a personalized study plan to improve my chess rating.`,
    "",
    `Current rating: ${data.currentRating}`,
    `Target rating: ${data.targetRating}`,
    `Available study time: ${data.studyTime} per week`,
    `Preferred time control: ${data.timeControl}`,
  ];

  if (data.weaknesses.length > 0) {
    lines.push(`Biggest weaknesses: ${data.weaknesses.join(", ")}`);
  } else {
    lines.push("Weaknesses: not specified (please assess based on my rating range)");
  }

  if (data.solvedTactics > 0) {
    lines.push(`Tactics puzzles solved on this platform: ${data.solvedTactics}`);
  }
  if (data.streakDays > 0) {
    lines.push(`Current practice streak: ${data.streakDays} day(s)`);
  }

  lines.push(
    "",
    "Please create a structured weekly study plan with specific exercises and recommended training on this platform (openings trainer, tactics trainer, endgame trainer, game analysis). Include milestones I should aim for."
  );

  return lines.join("\n");
}
