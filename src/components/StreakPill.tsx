"use client";

import { useStreak } from "@/lib/streak";

export function StreakPill() {
  const days = useStreak();
  if (days <= 0) return null;
  const tone =
    days >= 7
      ? "bg-accent text-white"
      : days >= 3
        ? "bg-warn-soft text-warn"
        : "bg-paper text-muted border border-line";
  return (
    <span
      title="Copy a message or request a human check once a day to keep it going."
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${tone}`}
    >
      <span aria-hidden>◆</span>
      {days}-day streak
    </span>
  );
}
