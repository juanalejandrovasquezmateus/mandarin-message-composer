import Link from "next/link";
import { StreakPill } from "./StreakPill";

/** Night band with a living Pudong skyline. Shared by every page. */
export function SiteNav({ current }: { current: "home" | "review" }) {
  return (
    <div className="relative bg-night text-ink">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* slow aurora behind the skyline */}
      <div
        aria-hidden
        className="absolute -inset-x-20 -top-24 h-72 animate-aurora opacity-70"
        style={{
          background:
            "radial-gradient(40rem 14rem at 30% 60%, rgba(255,61,127,0.28), transparent 60%), radial-gradient(36rem 12rem at 75% 50%, rgba(34,211,238,0.26), transparent 60%)",
        }}
      />
      </div>
      <div className="relative mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-4 pt-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Home">
          <span
            lang="zh-Hans"
            aria-hidden
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-medium text-white shadow-[0_0_14px_rgba(255,61,127,0.7)]"
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
              current === "home" ? "bg-ink/10 text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Home
          </Link>
          <Link
            href="/review"
            aria-current={current === "review" ? "page" : undefined}
            className={`rounded-full px-3 py-1 transition-colors ${
              current === "review" ? "bg-ink/10 text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Reviewer desk
          </Link>
        </nav>
      </div>
      <Skyline />
      <div
        aria-hidden
        className="h-px"
        style={{ background: "linear-gradient(90deg, transparent, #f2c35b 30%, #22d3ee 70%, transparent)" }}
      />
    </div>
  );
}

/** Lujiazui at night: Oriental Pearl, Jin Mao, SWFC, Shanghai Tower, with twinkling windows. */
function Skyline() {
  // Window lights: [x, y, delay]
  const lights: [number, number, number][] = [
    [206, 28, 0], [210, 34, 1.1], [214, 40, 0.4], [208, 46, 2.2],
    [280, 20, 0.6], [292, 26, 1.7], [286, 40, 0.2], [298, 46, 2.6],
    [358, 14, 1.3], [364, 22, 0.1], [360, 32, 2.1], [366, 42, 0.9], [362, 50, 1.9],
    [424, 32, 0.5], [432, 40, 1.5], [448, 24, 2.4], [452, 36, 0.8],
    [506, 36, 1.2], [516, 44, 0.3], [566, 28, 2.0], [570, 40, 1.0],
    [26, 42, 0.7], [54, 36, 1.8], [60, 46, 0.2], [650, 40, 1.4], [664, 46, 2.3],
  ];
  return (
    <svg
      aria-hidden
      viewBox="0 0 720 60"
      preserveAspectRatio="xMidYMax slice"
      className="relative mt-2 block h-16 w-full"
    >
      <defs>
        <linearGradient id="bld" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#223049" />
          <stop offset="1" stopColor="#0d1424" />
        </linearGradient>
        <linearGradient id="tower" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22d3ee" />
          <stop offset="1" stopColor="#1b2a44" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0f1a2e" />
          <stop offset="1" stopColor="#070a13" />
        </linearGradient>
      </defs>
      {/* river */}
      <rect x="0" y="54" width="720" height="6" fill="url(#water)" />
      <g fill="url(#bld)">
        <rect x="10" y="38" width="30" height="16" />
        <rect x="46" y="30" width="22" height="24" />
        <rect x="640" y="34" width="34" height="20" />
        <rect x="690" y="40" width="24" height="14" />
        {/* Jin Mao (stepped pagoda) */}
        <path d="M198 54 V24 h4 v-6 h4 v-6 h4 v-5 h2 v5 h4 v6 h4 v6 h4 v30 Z" />
        {/* SWFC (bottle opener) */}
        <path d="M270 54 V12 L288 2 L306 12 V54 h-8 V38 l-10 -8 l-10 8 V54 Z" />
        {/* mid-rise cluster */}
        <rect x="420" y="26" width="18" height="28" />
        <rect x="444" y="18" width="14" height="36" />
        <rect x="500" y="30" width="26" height="24" />
        <rect x="560" y="22" width="16" height="32" />
        <rect x="590" y="36" width="30" height="18" />
      </g>
      {/* Oriental Pearl */}
      <g>
        <rect x="118" y="8" width="2" height="46" fill="#34466a" />
        <path d="M104 54 L119 24 L134 54 Z" fill="#182238" />
        <circle cx="119" cy="20" r="7" fill="#ff3d7f" opacity="0.9" />
        <circle cx="119" cy="36" r="4" fill="#ff3d7f" opacity="0.7" />
        <circle cx="119" cy="20" r="2" fill="#fff" opacity="0.8" />
      </g>
      {/* Shanghai Tower: tapered body, slanted crown, spiral notch */}
      <g>
        <path d="M350 54 L352 10 L358 2 L370 4 L372 54 Z" fill="url(#tower)" />
        <path d="M354 52 C362 40 358 26 366 8" stroke="#8fe7f5" strokeOpacity="0.6" fill="none" strokeWidth="1" />
        <line x1="352" y1="18" x2="371" y2="18" stroke="#0a0e1a" strokeOpacity="0.5" />
        <line x1="352" y1="30" x2="371" y2="30" stroke="#0a0e1a" strokeOpacity="0.5" />
        <line x1="351" y1="42" x2="372" y2="42" stroke="#0a0e1a" strokeOpacity="0.5" />
        <circle cx="358" cy="2" r="1.6" fill="#fff" className="animate-twinkle" />
      </g>
      {/* window lights */}
      <g fill="#f2c35b">
        {lights.map(([x, y, d], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width="2"
            height="2"
            className="animate-twinkle"
            style={{ animationDelay: `${d}s` }}
          />
        ))}
      </g>
      {/* reflections */}
      <g opacity="0.35">
        <rect x="117" y="55" width="4" height="5" fill="#ff3d7f" />
        <rect x="356" y="55" width="10" height="5" fill="#22d3ee" />
      </g>
    </svg>
  );
}
