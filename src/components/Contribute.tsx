"use client";

import { useEffect, useState } from "react";
import { fetchReviewStatus, requestHumanCheck, UserFacingError } from "@/lib/compose";
import { PRACTICE_INTENTS } from "@/lib/practice";
import { looksLikeLanguage } from "@/lib/schemas";
import { recordActivity } from "@/lib/streak";
import {
  RELATIONSHIPS,
  TARGET_LANGUAGES,
  TONES,
  type TargetLanguage,
} from "@/lib/types";

type Sent = { id: string; line: string; status: "queued" | "approved" | "rejected"; by?: string };

/**
 * Native speakers give back: pick the language you speak, get a common situation,
 * write how you would really say it. Approved lines enter the bank and appear
 * for learners with a "checked" badge.
 */
export function Contribute() {
  const [lang, setLang] = useState<TargetLanguage>("zh-Hans");
  const [idx, setIdx] = useState(0);
  const [line, setLine] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<Sent[]>([]);

  const situation = PRACTICE_INTENTS[idx % PRACTICE_INTENTS.length];
  const L = TARGET_LANGUAGES[lang];
  const relLabel = RELATIONSHIPS.find((r) => r.id === situation.relationship)?.label;
  const toneLabel = TONES.find((t) => t.id === situation.tone)?.label;

  // Poll the lines this person sent until a reviewer decides.
  const waiting = sent.filter((s) => s.status === "queued").map((s) => s.id).join(",");
  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(async () => {
      const statuses = await fetchReviewStatus(waiting.split(","));
      setSent((prev) =>
        prev.map((s) => {
          const st = statuses.find((x) => x.id === s.id);
          if (!st || st.status === "queued" || st.status === "unknown") return s;
          if (st.status === "approved") return { ...s, status: "approved", by: st.verifiedBy, line: st.chinese };
          return { ...s, status: "rejected" };
        }),
      );
    }, 4000);
    return () => clearInterval(timer);
  }, [waiting]);

  function another() {
    setIdx((i) => (i + 1 + Math.floor(Math.random() * (PRACTICE_INTENTS.length - 1))) % PRACTICE_INTENTS.length);
    setLine("");
    setError(null);
  }

  async function send() {
    const text = line.trim();
    setError(null);
    if (!looksLikeLanguage(text, lang)) {
      setError(`Write it in ${L.name}.`);
      return;
    }
    setBusy(true);
    try {
      const outcome = await requestHumanCheck(
        { chinese: text, pinyin: "", english: situation.intent },
        { intent: situation.intent, relationship: situation.relationship, tone: situation.tone, targetLanguage: lang },
        "user",
      );
      if (outcome.status === "already_verified") {
        setError(`That exact line is already in the bank, approved by ${outcome.verifiedBy ?? "a reviewer"}.`);
        return;
      }
      if (outcome.id) setSent((s) => [{ id: outcome.id as string, line: text, status: "queued" }, ...s]);
      recordActivity();
      another();
    } catch (e) {
      setError(e instanceof UserFacingError ? e.message : "Couldn't send that line.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      aria-labelledby="contribute-title"
      className="glass relative overflow-hidden rounded-2xl border border-cyan/30 p-4 sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, rgba(34,211,238,0.6), transparent 70%)" }}
      />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wide text-cyan">Give back</p>
        <h2 id="contribute-title" className="mt-1 text-xl font-semibold tracking-tight text-ink">
          Speak Chinese or Spanish? Help a learner say it right.
        </h2>
        <p className="mt-1 max-w-xl text-sm text-muted">
          You get a common situation. Write how <em>you</em> would really text it. A reviewer
          checks it, and from then on learners see your wording with a &ldquo;checked&rdquo; badge.
        </p>

        <fieldset className="mt-4 flex flex-wrap items-center gap-3">
          <legend className="sr-only">Language you speak</legend>
          <span className="text-xs font-medium uppercase tracking-wide text-muted">I speak</span>
          <div className="inline-flex rounded-full border border-line bg-paper/60 p-0.5">
            {(Object.keys(TARGET_LANGUAGES) as TargetLanguage[]).map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={code === lang}
                onClick={() => {
                  setLang(code);
                  setLine("");
                  setError(null);
                }}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  code === lang ? "bg-cyan text-night" : "text-muted hover:text-ink"
                }`}
              >
                {code === "zh-Hans" ? "中文" : "Español"}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 rounded-xl border border-line bg-paper/50 p-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="rounded-full border border-line px-2 py-0.5">{relLabel}</span>
            <span className="rounded-full border border-line px-2 py-0.5">{toneLabel}</span>
            <button type="button" onClick={another} className="ml-auto underline-offset-2 hover:text-ink hover:underline">
              Another situation
            </button>
          </div>
          <p className="mt-2 text-base text-ink">&ldquo;{situation.intent}&rdquo;</p>
        </div>

        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            lang={lang === "es" ? "es" : "zh-Hans"}
            value={line}
            onChange={(e) => setLine(e.target.value.slice(0, 200))}
            placeholder={lang === "es" ? "Así lo diría yo…" : "我会这样说……"}
            aria-label={`How would you say it in ${L.name}?`}
            className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted/60 focus:border-cyan focus:outline-none focus:ring-2 focus:ring-cyan/25"
          />
          <button
            type="submit"
            disabled={busy || line.trim().length === 0}
            className="rounded-full bg-cyan px-4 py-2 text-sm font-medium text-night transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {busy ? "Sending…" : "Send to a reviewer"}
          </button>
        </form>
        {error && <p role="alert" className="mt-2 text-xs text-accent-deep">{error}</p>}

        {sent.length > 0 && (
          <ul className="mt-4 space-y-1.5" aria-live="polite">
            {sent.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span lang={lang === "es" ? "es" : "zh-Hans"} className="text-ink">{s.line}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${
                    s.status === "approved"
                      ? "bg-ok-soft text-ok"
                      : s.status === "rejected"
                        ? "bg-accent-soft text-accent-deep"
                        : "bg-paper text-muted"
                  }`}
                >
                  {s.status === "approved"
                    ? `✓ Approved by ${s.by}. Learners now see it.`
                    : s.status === "rejected"
                      ? "Not added"
                      : "Waiting for a reviewer…"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
