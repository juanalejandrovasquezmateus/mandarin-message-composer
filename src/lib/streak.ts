// Per-device daily streak. Lives in this browser only; no account, no server.
// An "activity" is copying a message or requesting a human check.
import { useSyncExternalStore } from "react";

const KEY = "mmc-streak";
type Saved = { date: string; count: number };
const listeners = new Set<() => void>();

function dateKey(d: Date) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function today() {
  return dateKey(new Date());
}
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dateKey(d);
}

function read(): Saved | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

export function recordActivity() {
  const s = read();
  const t = today();
  let next: Saved;
  if (!s) next = { date: t, count: 1 };
  else if (s.date === t) next = s;
  else if (s.date === yesterday()) next = { date: t, count: s.count + 1 };
  else next = { date: t, count: 1 };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function snapshot(): number {
  const s = read();
  if (!s) return 0;
  return s.date === today() || s.date === yesterday() ? s.count : 0;
}

/** Current streak length in days (0 on the server and before any activity). */
export function useStreak(): number {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}
