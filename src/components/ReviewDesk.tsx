"use client";

import Link from "next/link";
import { useState } from "react";
import {
  RELATIONSHIPS,
  TONES,
  type Region,
  type ReviewDecision,
  type ReviewRequestItem,
  type ReviewerLevel,
  type Tone,
} from "@/lib/types";
import { ProvenanceBadge } from "./ProvenanceBadge";

const REGIONS: { id: Region; label: string }[] = [
  { id: "mainland", label: "Mainland" },
  { id: "taiwan", label: "Taiwan" },
  { id: "other", label: "Other" },
];

type Queue =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; level: ReviewerLevel; items: ReviewRequestItem[]; verifiedCount: number };

export function ReviewDesk() {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [queue, setQueue] = useState<Queue>({ status: "idle" });
  const [toast, setToast] = useState<string | null>(null);

  async function load() {
    setQueue({ status: "loading" });
    try {
      const r = await fetch("/api/review/queue", {
        headers: { "x-reviewer-code": code.trim() },
      });
      if (r.status === 401) {
        setQueue({ status: "error", message: "That reviewer code isn't recognised." });
        return;
      }
      if (r.status === 503) {
        setQueue({ status: "error", message: "The reviewer desk isn't configured on this server yet." });
        return;
      }
      if (!r.ok) throw new Error();
      const data = (await r.json()) as {
        level: ReviewerLevel;
        items: ReviewRequestItem[];
        verifiedCount: number;
      };
      setQueue({ status: "ready", ...data });
    } catch {
      setQueue({ status: "error", message: "Couldn't load the queue." });
    }
  }

  function removeItem(id: string, message: string) {
    setQueue((q) =>
      q.status === "ready"
        ? {
            ...q,
            items: q.items.filter((i) => i.id !== id),
            verifiedCount: q.verifiedCount + (message.startsWith("Added") ? 1 : 0),
          }
        : q,
    );
    setToast(message);
    setTimeout(() => setToast(null), 3500);
  }

  const canLoad = code.trim().length > 0 && name.trim().length > 0;

  return (
    <div className="space-y-8">
      <header>
        <Link href="/" className="text-xs text-muted underline-offset-2 hover:underline">
          ← Back to the composer
        </Link>
        <h1 className="mt-3 text-xl font-semibold tracking-tight text-ink">Reviewer desk</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
          Lines that users asked a human to check. Keep it if a native speaker would
          text it, fix it if it needs a better wording, reject it if it shouldn&rsquo;t be
          in the bank. Your name goes on every line you approve.
        </p>
      </header>

      <section className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Reviewer code</span>
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoComplete="off"
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <label className="text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Your name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={60}
              className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
          <button
            type="button"
            onClick={load}
            disabled={!canLoad || queue.status === "loading"}
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-black disabled:opacity-40"
          >
            {queue.status === "loading" ? "Loading…" : "Load queue"}
          </button>
        </div>
        {queue.status === "error" && (
          <p role="alert" className="mt-3 text-sm text-accent-deep">{queue.message}</p>
        )}
        {queue.status === "ready" && (
          <p className="mt-3 text-xs text-muted">
            Signed in as {name.trim()} ({queue.level === "native" ? "official native checker" : "community reviewer"}).
            Bank: {queue.verifiedCount} verified lines. Waiting: {queue.items.length}.
          </p>
        )}
      </section>

      {toast && (
        <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{toast}</p>
      )}

      {queue.status === "ready" && queue.items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-muted">
          Nothing waiting. When a user taps &ldquo;Request a human check&rdquo;, the line appears here.
        </p>
      )}

      {queue.status === "ready" &&
        queue.items.map((item) => (
          <ReviewItem
            key={item.id}
            item={item}
            code={code.trim()}
            reviewerName={name.trim()}
            level={queue.level}
            onDone={removeItem}
          />
        ))}
    </div>
  );
}

function ReviewItem({
  item,
  code,
  reviewerName,
  level,
  onDone,
}: {
  item: ReviewRequestItem;
  code: string;
  reviewerName: string;
  level: ReviewerLevel;
  onDone: (id: string, message: string) => void;
}) {
  const [fixing, setFixing] = useState(false);
  const [fixed, setFixed] = useState(item.chinese);
  const [note, setNote] = useState("");
  const [tone, setTone] = useState<Tone>(item.tone);
  const [region, setRegion] = useState<Region>(item.region);
  const [busy, setBusy] = useState<ReviewDecision | null>(null);
  const [error, setError] = useState<string | null>(null);

  const relLabel = RELATIONSHIPS.find((r) => r.id === item.relationship)?.label ?? item.relationship;
  const badgeText = level === "native" ? "checked by a native speaker" : "checked by a community member";

  async function decide(decision: ReviewDecision) {
    setBusy(decision);
    setError(null);
    try {
      const r = await fetch("/api/review/decide", {
        method: "POST",
        headers: { "content-type": "application/json", "x-reviewer-code": code },
        body: JSON.stringify({
          id: item.id,
          decision,
          chineseFixed: decision === "fix" ? fixed : undefined,
          note: note.trim() || undefined,
          reviewerName,
          tone,
          region,
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string; reason?: string };
      if (r.status === 422) {
        setError(`The AI screen flagged this edit: ${data.reason ?? "unspecified"}. Adjust it or reject the line.`);
        return;
      }
      if (!r.ok) {
        setError(
          data.error === "no_provider"
            ? "Fixes need the AI screen, and no AI key is configured."
            : "Couldn't save that decision. Try again.",
        );
        return;
      }
      onDone(
        item.id,
        decision === "reject" ? "Rejected and removed from the queue." : `Added to the bank as ${badgeText}.`,
      );
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <article className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        <ProvenanceBadge provenance={item.provenance} />
        <span className="rounded-full border border-line px-2 py-0.5">{relLabel}</span>
        <span className="rounded-full border border-line px-2 py-0.5">{item.tone}</span>
        {item.context && <span className="italic">“{item.context}”</span>}
      </div>
      <p className="mt-3 text-xs italic text-muted">User meant: “{item.intent}”</p>
      <p lang="zh-Hans" className="mt-2 text-2xl leading-snug text-ink">{item.chinese}</p>
      <p className="mt-1 text-sm text-muted">{item.pinyin}</p>
      <p className="mt-2 text-sm text-ink">{item.english}</p>

      {fixing && (
        <div className="mt-4 space-y-3 rounded-xl bg-paper p-3">
          <label className="block text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">Better wording</span>
            <textarea
              lang="zh-Hans"
              value={fixed}
              onChange={(e) => setFixed(e.target.value)}
              rows={2}
              maxLength={200}
              className="mt-1.5 w-full rounded-xl border border-line bg-card px-3 py-2 text-lg focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </label>
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="text-sm sm:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Tone</span>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          >
            {TONES.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">Region</span>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as Region)}
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm"
          >
            {REGIONS.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </select>
        </label>
        <label className="text-sm sm:col-span-1">
          <span className="text-xs font-medium uppercase tracking-wide text-muted">How it sounds (note)</span>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="e.g. casual, fine between friends"
            className="mt-1.5 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm placeholder:text-muted/60"
          />
        </label>
      </div>

      {error && <p role="alert" className="mt-3 text-sm text-accent-deep">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {!fixing ? (
          <>
            <button
              type="button"
              onClick={() => decide("keep")}
              disabled={busy !== null}
              className="rounded-full bg-ok px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              {busy === "keep" ? "Saving…" : "Keep as is"}
            </button>
            <button
              type="button"
              onClick={() => setFixing(true)}
              disabled={busy !== null}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-line-strong disabled:opacity-40"
            >
              Fix wording
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => decide("fix")}
              disabled={busy !== null || fixed.trim().length === 0}
              className="rounded-full bg-ok px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              {busy === "fix" ? "Screening and saving…" : "Approve with fix"}
            </button>
            <button
              type="button"
              onClick={() => {
                setFixing(false);
                setFixed(item.chinese);
              }}
              disabled={busy !== null}
              className="rounded-full border border-line px-4 py-2 text-sm text-ink hover:border-line-strong"
            >
              Cancel fix
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => decide("reject")}
          disabled={busy !== null}
          className="ml-auto rounded-full px-4 py-2 text-sm text-accent-deep hover:bg-accent-soft disabled:opacity-40"
        >
          {busy === "reject" ? "Removing…" : "Reject"}
        </button>
      </div>
    </article>
  );
}
