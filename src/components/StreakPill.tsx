"use client";

import { useState } from "react";
import { useStreak } from "@/lib/streak";

/** Streak tiers. The Shanghai Tower lights up as the streak grows. */
const TIERS = [
  { min: 0, name: "Unlit", fill: "none", stroke: "#8b909b", glow: false },
  { min: 1, name: "Dawn", fill: "#6b7a90", stroke: "#6b7a90", glow: false },
  { min: 3, name: "Amber", fill: "#c9973b", stroke: "#c9973b", glow: false },
  { min: 7, name: "Bund red", fill: "#c7372c", stroke: "#c7372c", glow: false },
  { min: 14, name: "Neon", fill: "url(#neon)", stroke: "#3fb8d6", glow: true },
  { min: 30, name: "Gold crown", fill: "url(#crown)", stroke: "#e2b957", glow: true },
] as const;

type Tier = (typeof TIERS)[number];

function tierFor(days: number): Tier {
  let t: Tier = TIERS[0];
  for (const tier of TIERS) if (days >= tier.min) t = tier;
  return t;
}

export function Tower({ days, size = 22 }: { days: number; size?: number }) {
  const t = tierFor(days);
  return (
    <svg
      aria-hidden
      width={size}
      height={size * 1.6}
      viewBox="0 0 20 32"
      className={t.glow ? "drop-shadow-[0_0_4px_rgba(255,220,120,0.9)]" : ""}
    >
      <defs>
        <linearGradient id="neon" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#3fb8d6" />
          <stop offset="1" stopColor="#d64f9a" />
        </linearGradient>
        <linearGradient id="crown" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#c9973b" />
          <stop offset="1" stopColor="#f7df9a" />
        </linearGradient>
      </defs>
      {/* twisting tower body and spire */}
      <path
        d="M4 31 C3 22 2 14 7 3 L10 0 L13 3 C18 14 17 22 16 31 Z"
        fill={t.fill}
        stroke={t.stroke}
        strokeWidth="1"
      />
      <path d="M7 29 C6 20 8 12 10 5" stroke="white" strokeOpacity="0.45" fill="none" strokeWidth="0.8" />
    </svg>
  );
}

export function StreakPill() {
  const days = useStreak();
  const [open, setOpen] = useState(false);
  const t = tierFor(days);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        title="Your daily streak. Copy a message or request a human check once a day to keep it lit."
        className="inline-flex items-center gap-1.5 rounded-full border border-paper/20 px-2.5 py-1 text-xs text-paper/90 hover:border-paper/50"
      >
        <Tower days={days} size={12} />
        {days > 0 ? `${days}-day streak` : "Streak"}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Streak tiers"
          className="absolute right-0 z-20 mt-2 w-64 rounded-2xl border border-line bg-card p-3 text-ink shadow-lg"
        >
          <p className="text-xs text-muted">
            The tower lights up as your streak grows. {days > 0 ? `You're at ${days} day${days === 1 ? "" : "s"}: ${t.name}.` : "Copy a message or request a check to light it."}
          </p>
          <ul className="mt-2 space-y-1">
            {TIERS.map((tier) => (
              <li
                key={tier.name}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 text-sm ${
                  tier === t ? "bg-paper font-medium" : ""
                }`}
              >
                <Tower days={tier.min} size={14} />
                <span className="flex-1">{tier.name}</span>
                <span className="text-xs text-muted">
                  {tier.min === 0 ? "0 days" : `${tier.min}+ days`}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
