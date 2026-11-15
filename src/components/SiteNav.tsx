import Link from "next/link";
import { StreakPill } from "./StreakPill";

/** Night-blue band with the Pudong skyline. Shared by every page. */
export function SiteNav({ current }: { current: "home" | "review" }) {
  return (
    <div className="bg-night text-paper">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
          <span
            lang="zh-Hans"
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-medium text-white"
          >
            说
          </span>
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            Mandarin Message Composer
          </span>
        </Link>
        <nav className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
          <StreakPill />
          <Link
            href="/"
            aria-current={current === "home" ? "page" : undefined}
            className={`rounded-full px-3 py-1 transition-colors ${
              current === "home" ? "bg-paper/15 text-paper" : "text-paper/70 hover:text-paper"
            }`}
          >
            Home
          </Link>
          <Link
            href="/review"
            aria-current={current === "review" ? "page" : undefined}
            className={`rounded-full px-3 py-1 transition-colors ${
              current === "review" ? "bg-paper/15 text-paper" : "text-paper/70 hover:text-paper"
            }`}
          >
            Reviewer desk
          </Link>
        </nav>
      </div>
      <Skyline />
      <div className="h-0.5 bg-gold" aria-hidden />
    </div>
  );
}

/** Simplified Lujiazui silhouette: Oriental Pearl, Jin Mao, SWFC, Shanghai Tower. */
function Skyline() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 720 56"
      preserveAspectRatio="xMidYMax slice"
      className="mt-2 block h-14 w-full text-night-soft"
      fill="currentColor"
    >
      {/* ground */}
      <rect x="0" y="52" width="720" height="4" />
      {/* low buildings */}
      <rect x="10" y="38" width="30" height="14" />
      <rect x="46" y="30" width="22" height="22" />
      <rect x="640" y="34" width="34" height="18" />
      <rect x="690" y="40" width="24" height="12" />
      {/* Oriental Pearl */}
      <rect x="118" y="8" width="2" height="44" />
      <circle cx="119" cy="20" r="7" />
      <circle cx="119" cy="36" r="4" />
      <path d="M104 52 L119 22 L134 52 Z" opacity="0.5" />
      {/* Jin Mao (stepped) */}
      <path d="M200 52 V22 h4 v-6 h4 v-6 h4 v-4 h2 v4 h4 v6 h4 v6 h4 v30 Z" />
      {/* SWFC (bottle opener) */}
      <path d="M270 52 V12 L288 2 L306 12 V52 h-8 V36 l-10 -8 l-10 8 V52 Z" />
      {/* Shanghai Tower (twist) */}
      <path d="M352 52 C350 36 348 24 356 4 L362 0 L368 4 C376 24 374 36 372 52 Z" />
      <path d="M358 50 C356 34 358 20 362 8" stroke="currentColor" strokeOpacity="0.4" fill="none" />
      {/* mid-rise cluster */}
      <rect x="420" y="26" width="18" height="26" />
      <rect x="444" y="18" width="14" height="34" />
      <rect x="500" y="30" width="26" height="22" />
      <rect x="560" y="22" width="16" height="30" />
      <rect x="590" y="36" width="30" height="16" />
    </svg>
  );
}
