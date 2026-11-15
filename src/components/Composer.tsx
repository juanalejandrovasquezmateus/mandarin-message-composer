"use client";

import { useEffect, useRef, useState } from "react";
import {
  composeMessage,
  fetchReviewStatus,
  requestHumanCheck,
  UserFacingError,
  verifyLine,
} from "@/lib/compose";
import { DEMO_EXAMPLES } from "@/lib/demo-data";
import { recordActivity } from "@/lib/streak";
import { looksLikeLanguage } from "@/lib/schemas";
import { PRACTICE_INTENTS } from "@/lib/practice";
import {
  TARGET_LANGUAGES,
  type Candidate,
  type ComposeResult,
  type Relationship,
  type ResultSource,
  type ReviewStatus,
  type TargetLanguage,
  type Tone,
} from "@/lib/types";
import { IntentForm } from "./IntentForm";
import {
  CandidateCard,
  CandidateSkeleton,
  type ReviewRequestState,
} from "./CandidateCard";
import { MeaningCheck, type VerifyState } from "./MeaningCheck";
import { DraftTray, joinDraft } from "./DraftTray";

type Status = "idle" | "loading" | "ready" | "error";

interface ReviewTrack {
  state: ReviewRequestState;
  id?: string;
  detail?: string;
}

const POLL_MS = 4000;

export function Composer() {
  const [intent, setIntent] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [tone, setTone] = useState<Tone>("casual");
  const [context, setContext] = useState("");
  const [lang, setLang] = useState<TargetLanguage>("zh-Hans");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [source, setSource] = useState<ResultSource | null>(null);
  const [note, setNote] = useState<string | undefined>();
  const [selected, setSelected] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, VerifyState>>({});
  const [reviews, setReviews] = useState<Record<string, ReviewTrack>>({});

  // Lines the user wrote themselves; they go through the same review.
  const [own, setOwn] = useState<Candidate[]>([]);
  const [ownInput, setOwnInput] = useState("");
  const [ownError, setOwnError] = useState<string | null>(null);

  const [draft, setDraft] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // The draft lives in memory only: nothing the user writes is stored anywhere.

  // Live status: while any requested line is waiting, ask the server every few
  // seconds and update the card in place when a reviewer decides.
  const waitingIds = Object.values(reviews)
    .filter((r) => r.state === "sent" && r.id)
    .map((r) => r.id as string)
    .sort()
    .join(",");
  useEffect(() => {
    if (!waitingIds) return;
    let cancelled = false;
    const tick = async () => {
      const statuses = await fetchReviewStatus(waitingIds.split(","));
      if (cancelled) return;
      for (const s of statuses) applyStatus(s);
    };
    const timer = setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
    // applyStatus only touches setState functions, which are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waitingIds]);

  function applyStatus(s: ReviewStatus) {
    if (s.status === "queued" || s.status === "unknown") return;
    setReviews((prev) => {
      const key = Object.keys(prev).find((k) => prev[k].id === s.id);
      if (!key || prev[key].state !== "sent") return prev;
      const next = { ...prev };
      if (s.status === "rejected") {
        next[key] = { ...prev[key], state: "rejected", detail: "The reviewer decided this line should not be used." };
        return next;
      }
      const who = s.level === "native" ? `${s.verifiedBy} (official native checker)` : `${s.verifiedBy} (community member)`;
      next[key] = {
        ...prev[key],
        state: s.changed ? "changed" : "approved",
        detail: s.changed
          ? `${who} changed it to the line shown now.${s.note ? ` Note: ${s.note}` : ""}`
          : `Approved by ${who}.${s.note ? ` Note: ${s.note}` : ""}`,
      };
      if (s.changed) {
        // The card now shows the reviewer's wording; keep the status under the new key.
        next[s.chinese] = next[key];
        delete next[key];
      }
      return next;
    });
    if (s.status === "approved") {
      const upgrade = (c: Candidate): Candidate =>
        c.chinese === keyFor(s) || c.chinese === s.chinese
          ? {
              ...c,
              chinese: s.chinese,
              pinyin: s.pinyin,
              vocab: s.changed ? [] : c.vocab,
              provenance: s.level === "native" ? "verified-native" : "verified-community",
              verifierNote: s.note || undefined,
            }
          : c;
      setResult((r) => (r ? { ...r, candidates: r.candidates.map(upgrade) } : r));
      setOwn((o) => o.map(upgrade));
    }
  }
  // The chinese text a status belongs to is the key whose track carries its id.
  function keyFor(s: ReviewStatus): string | undefined {
    return Object.keys(reviews).find((k) => reviews[k].id === s.id);
  }

  async function submit() {
    const id = ++requestId.current;
    setStatus("loading");
    setSelected(null);
    setNote(undefined);
    setChecks({});
    setReviews({});
    setOwn([]);
    setOwnInput("");
    setOwnError(null);
    try {
      const res = await composeMessage({
        intent: intent.trim(),
        relationship,
        tone,
        context: context.trim() || undefined,
        targetLanguage: lang,
      });
      if (id !== requestId.current) return; // a newer request superseded this one
      setResult(res.result);
      setSource(res.source);
      setNote(res.note);
      setStatus("ready");
      requestAnimationFrame(() =>
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    } catch (e) {
      if (id !== requestId.current) return;
      setErrorMessage(
        e instanceof UserFacingError ? e.message : "Something went wrong while composing.",
      );
      setStatus("error");
    }
  }

  async function runCheck(candidate: Candidate, current: ComposeResult) {
    const key = candidate.chinese;
    setChecks((c) => ({ ...c, [key]: { status: "loading" } }));
    try {
      const verdict = await verifyLine(candidate, {
        chinese: candidate.chinese,
        intent: current.intent,
        relationship: current.relationship,
        tone: current.tone,
        targetLanguage: current.targetLanguage,
      });
      setChecks((c) => ({ ...c, [key]: { status: "ready", result: verdict } }));
    } catch (e) {
      setChecks((c) => ({
        ...c,
        [key]: {
          status: "error",
          message: e instanceof UserFacingError ? e.message : "Couldn't check this line.",
        },
      }));
    }
  }

  function select(candidate: Candidate) {
    if (!result) return;
    if (selected === candidate.chinese) {
      setSelected(null);
      return;
    }
    setSelected(candidate.chinese);
    const existing = checks[candidate.chinese];
    if (!existing || existing.status === "error") void runCheck(candidate, result);
  }

  async function requestReview(
    candidate: Candidate,
    current: ComposeResult,
    sourceKind: "ai" | "user" = "ai",
  ) {
    const key = candidate.chinese;
    setReviews((r) => ({ ...r, [key]: { state: "sending" } }));
    try {
      const outcome = await requestHumanCheck(candidate, current, sourceKind);
      if (outcome.status === "already_verified") {
        setReviews((r) => ({
          ...r,
          [key]: {
            state: "verified",
            detail: `Already approved by ${outcome.verifiedBy ?? "a reviewer"}.`,
          },
        }));
        return;
      }
      setReviews((r) => ({ ...r, [key]: { state: "sent", id: outcome.id } }));
      if (outcome.status === "queued") recordActivity();
    } catch (e) {
      setReviews((r) => ({
        ...r,
        [key]: {
          state: "error",
          detail: e instanceof UserFacingError ? e.message : undefined,
        },
      }));
    }
  }

  async function submitOwn() {
    if (!result) return;
    const text = ownInput.trim();
    setOwnError(null);
    if (!looksLikeLanguage(text, result.targetLanguage)) {
      setOwnError("Write the line in " + TARGET_LANGUAGES[result.targetLanguage].name + ".");
      return;
    }
    if (own.some((c) => c.chinese === text) || result.candidates.some((c) => c.chinese === text)) {
      setOwnError("That line is already on this page.");
      return;
    }
    const candidate: Candidate = {
      label: "own",
      chinese: text,
      pinyin: "",
      english: result.intent,
      nuance: "Your own wording. Ask a reviewer to check it, and it can join the bank for everyone.",
      vocab: [],
      provenance: "user-submitted",
    };
    setOwn((o) => [...o, candidate]);
    setOwnInput("");
    await requestReview(candidate, result, "user");
  }

  function addToDraft(line: string) {
    if (draft.includes(line)) return;
    setDraft([...draft, line]);
    setCopied(false);
  }

  async function copyDraft() {
    const text = joinDraft(draft);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older browsers: fall back to a temporary textarea.
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopied(true);
    recordActivity();
    setTimeout(() => setCopied(false), 2000);
  }

  const allCards = result ? [...result.candidates, ...own] : [];
  const resultLang: TargetLanguage = result?.targetLanguage ?? lang;

  function surprise() {
    const pick = PRACTICE_INTENTS[Math.floor(Math.random() * PRACTICE_INTENTS.length)];
    setIntent(pick.intent);
    setRelationship(pick.relationship);
    setTone(pick.tone);
  }
  const selectedCandidate = allCards.find((c) => c.chinese === selected) ?? null;
  const checkedCount = allCards.filter((c) => c.provenance.startsWith("verified")).length;

  function reviewFor(c: Candidate) {
    if (source !== "live" || !result) return undefined;
    const track = reviews[c.chinese];
    return {
      state: track?.state ?? "idle",
      detail: track?.detail,
      onRequest: () => void requestReview(c, result, c.label === "own" ? "user" : "ai"),
    };
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            Say what you mean. <span className="neon-text">Know how it sounds.</span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted">
            Three natural ways to say it, a check of what it really says, and a label on
            every line telling you whether a real person has approved it.
          </p>
        </div>
        {source && <ModeBadge source={source} />}
      </header>

      <IntentForm
        intent={intent}
        relationship={relationship}
        tone={tone}
        context={context}
        lang={lang}
        loading={status === "loading"}
        examples={DEMO_EXAMPLES.map(({ intent, relationship, tone }) => ({
          intent,
          relationship,
          tone,
        }))}
        onIntentChange={setIntent}
        onRelationshipChange={setRelationship}
        onToneChange={setTone}
        onContextChange={setContext}
        onLangChange={setLang}
        onSurprise={surprise}
        onPickExample={(ex) => {
          setIntent(ex.intent);
          setRelationship(ex.relationship);
          setTone(ex.tone);
        }}
        onSubmit={submit}
      />

      <div ref={resultsRef} className="scroll-mt-6 space-y-4">
        {status === "loading" && (
          <>
            <SectionTitle>Three ways to say it</SectionTitle>
            <p className="text-sm text-muted" role="status">
              Composing three versions. This usually takes a few seconds…
            </p>
            <CandidateSkeleton />
            <CandidateSkeleton />
            <CandidateSkeleton />
          </>
        )}

        {status === "error" && (
          <div
            role="alert"
            className="rounded-2xl border border-accent/40 bg-accent-soft p-4 text-sm text-accent-deep"
          >
            {errorMessage}{" "}
            <button
              type="button"
              onClick={submit}
              className="font-medium underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        )}

        {status === "ready" && result && (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <SectionTitle>Three ways to say it in {TARGET_LANGUAGES[resultLang].name}</SectionTitle>
              <p className="text-xs text-muted" aria-live="polite">
                {checkedCount === 0
                  ? "None of these lines has been checked by a person yet."
                  : `${checkedCount} of ${allCards.length} checked by a person`}
              </p>
            </div>
            {note && (
              <p className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-deep">
                {note}
              </p>
            )}
            <div className="space-y-4">
              {result.candidates.map((c) => (
                <CandidateCard
                  key={c.label}
                  candidate={c}
                  lang={resultLang}
                  selected={selected === c.chinese}
                  inDraft={draft.includes(c.chinese)}
                  onSelect={() => select(c)}
                  onAdd={() => addToDraft(c.chinese)}
                  review={reviewFor(c)}
                />
              ))}
              {own.map((c) => (
                <CandidateCard
                  key={`own-${c.chinese}`}
                  candidate={c}
                  lang={resultLang}
                  selected={selected === c.chinese}
                  inDraft={draft.includes(c.chinese)}
                  onSelect={() => select(c)}
                  onAdd={() => addToDraft(c.chinese)}
                  review={reviewFor(c)}
                />
              ))}
            </div>

            {source === "live" && (
              <form
                className="rounded-2xl border border-dashed border-line-strong bg-card/40 p-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  void submitOwn();
                }}
              >
                <label htmlFor="own" className="text-sm font-medium text-ink">
                  Know a better way to say it?
                </label>
                <p className="mt-1 text-xs text-muted">
                  Write your own {TARGET_LANGUAGES[resultLang].name} line. A reviewer checks it,
                  and if it passes it joins the bank for everyone, with your wording.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <input
                    id="own"
                    lang={resultLang === "es" ? "es" : "zh-Hans"}
                    value={ownInput}
                    onChange={(e) => setOwnInput(e.target.value.slice(0, 200))}
                    placeholder={resultLang === "es" ? "p. ej.: ¿Puedo invitar a un amigo a cenar el sábado?" : "例如：周六我想叫个朋友来家里吃饭，可以吗？"}
                    className="min-w-0 flex-1 rounded-xl border border-line bg-paper px-4 py-2.5 text-base text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <button
                    type="submit"
                    disabled={ownInput.trim().length === 0}
                    className="rounded-full border border-ink px-4 py-2 text-sm text-ink hover:bg-ink hover:text-night disabled:opacity-40"
                  >
                    Send for a human check
                  </button>
                </div>
                {ownError && (
                  <p role="alert" className="mt-2 text-xs text-accent-deep">{ownError}</p>
                )}
              </form>
            )}
          </>
        )}
      </div>

      {selectedCandidate && result && (
        <MeaningCheck
          candidate={selectedCandidate}
          lang={resultLang}
          intent={result.intent}
          state={checks[selectedCandidate.chinese] ?? { status: "loading" }}
          onRetry={() => void runCheck(selectedCandidate, result)}
        />
      )}

      {(status === "ready" || draft.length > 0) && (
        <DraftTray
          lines={draft}
          lang={resultLang}
          copied={copied}
          onRemove={(i) => setDraft(draft.filter((_, j) => j !== i))}
          onClear={() => setDraft([])}
          onCopy={copyDraft}
        />
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-semibold tracking-tight text-ink">{children}</h2>
  );
}

function ModeBadge({ source }: { source: ResultSource }) {
  if (source === "live") {
    return (
      <span
        title="Candidates are generated live by the AI service."
        className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1 text-xs text-muted"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-ok" />
        Live AI
      </span>
    );
  }
  return (
    <span
      title="Prepared examples. No AI is being called."
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-soft px-3 py-1 text-xs font-medium text-accent-deep"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      Demo Mode
    </span>
  );
}
