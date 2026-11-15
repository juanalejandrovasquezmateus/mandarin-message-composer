"use client";

import { useState } from "react";
import { useStreak } from "@/lib/streak";

/** Streak tiers. The Shanghai Tower lights up floor by floor as the streak grows. */
const TIERS = [
  { min: 0, name: "Unlit", top: "#2b3a57", bottom: "#182238", glow: "", lit: 0 },
  { min: 1, name: "Dawn", top: "#6b7a90", bottom: "#2b3a57", glow: "", lit: 2 },
  { min: 3, name: "Amber", top: "#f2c35b", bottom: "#6b4a14", glow: "#f2c35b", lit: 4 },
  { min: 7, name: "Bund red", top: "#ff3d7f", bottom: "#5a1230", glow: "#ff3d7f", lit: 6 },
  { min: 14, name: "Neon", top: "#22d3ee", bottom: "#ff3d7f", glow: "#22d3ee", lit: 8 },
  { min: 30, name: "Gold crown", top: "#fff2c4", bottom: "#f2c35b", glow: "#f2c35b", lit: 9 },
] as const;

type Tier = (typeof TIERS)[number];

function tierFor(days: number): Tier {
  let t: Tier = TIERS[0];
  for (const tier of TIERS) if (days >= tier.min) t = tier;
  return t;
}

/**
 * Shanghai Tower, simplified but recognisable: wide plinth, tapered body with nine
 * floor zones, the spiral notch that twists up the facade, and the slanted crown.
 */
export function Tower({ days, size = 22, id = "t" }: { days: number; size?: number; id?: string }) {
  const t = tierFor(days);
  const zones = 9;
  return (
    <svg
      aria-hidden
      width={size}
      height={size * 2}
      viewBox="0 0 40 80"
      className={t.glow ? "animate-pulse-glow" : ""}
      style={t.glow ? ({ "--glow": t.glow } as React.CSSProperties) : undefined}
    >
      <defs>
        <linearGradient id={`${id}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={t.top} />
          <stop offset="1" stopColor={t.bottom} />
        </linearGradient>
      </defs>
      {/* plinth */}
      <rect x="8" y="70" width="24" height="6" rx="1" fill="#182238" stroke="#34466a" strokeWidth="1" />
      {/* body: tapers from 20 wide at the base to 12 at the crown, crown cut on a slant */}
      <path
        d="M10 70 L13 12 L16 6 L27 4 L30 70 Z"
        fill={`url(#${id}-body)`}
        stroke="#34466a"
        strokeWidth="1"
      />
      {/* floor zones; lit ones glow from the bottom up */}
      {Array.from({ length: zones }, (_, i) => {
        const y = 66 - i * 6.5;
        const litZone = i < t.lit;
        const w = 20 - i * 0.8;
        const x = 20 - w / 2;
        return (
          <rect
            key={i}
            x={x}
            y={y - 4}
            width={w}
            height="3.6"
            fill={litZone ? "#ffffff" : "#000000"}
            opacity={litZone ? 0.28 : 0.22}
          />
        );
      })}
      {/* spiral notch */}
      <path d="M12 66 C30 52, 10 34, 26 10" stroke="#ffffff" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
      {/* crown light */}
      <circle cx="27" cy="4" r="1.8" fill={t.glow || "#8d97ad"} className="animate-twinkle" />
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
        title="Your daily streak. Copy a message or request a human check once a day to keep the tower lit."
        className="inline-flex items-center gap-1.5 rounded-full border border-line-strong/70 bg-card/60 px-2.5 py-1 text-xs text-ink hover:border-cyan/70"
      >
        <Tower days={days} size={11} id="pill" />
        {days > 0 ? `${days}-day streak` : "Streak"}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Streak tiers"
          className="glass absolute right-0 z-20 mt-2 w-72 animate-rise rounded-2xl border border-line p-3 text-ink shadow-[0_10px_40px_rgba(0,0,0,0.5)]"
        >
          <p className="text-xs text-muted">
            The tower lights up floor by floor as your streak grows.{" "}
            {days > 0
              ? `You're at ${days} day${days === 1 ? "" : "s"}: ${t.name}.`
              : "Copy a message or request a check to light the first floors."}
          </p>
          <ul className="mt-2 space-y-1">
            {TIERS.map((tier, i) => (
              <li
                key={tier.name}
                className={`flex items-center gap-3 rounded-lg px-2 py-1 text-sm ${
                  tier === t ? "bg-ink/10 font-medium" : ""
                }`}
              >
                <Tower days={tier.min} size={13} id={`tier${i}`} />
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
