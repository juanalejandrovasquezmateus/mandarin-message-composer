"use client";

import { useRef, useState } from "react";
import { composeMessage, UserFacingError, verifyLine } from "@/lib/compose";
import { DEMO_EXAMPLES } from "@/lib/demo-data";
import type {
  Candidate,
  ComposeResult,
  Relationship,
  ResultSource,
  Tone,
} from "@/lib/types";
import { IntentForm } from "./IntentForm";
import { CandidateCard, CandidateSkeleton } from "./CandidateCard";
import { MeaningCheck, type VerifyState } from "./MeaningCheck";
import { DraftTray, joinDraft } from "./DraftTray";

type Status = "idle" | "loading" | "ready" | "error";

export function Composer() {
  const [intent, setIntent] = useState("");
  const [relationship, setRelationship] = useState<Relationship>("friend");
  const [tone, setTone] = useState<Tone>("casual");
  const [context, setContext] = useState("");

  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [result, setResult] = useState<ComposeResult | null>(null);
  const [source, setSource] = useState<ResultSource | null>(null);
  const [note, setNote] = useState<string | undefined>();
  const [selected, setSelected] = useState<number | null>(null);
  const [checks, setChecks] = useState<Record<string, VerifyState>>({});

  const [draft, setDraft] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // The draft lives in memory only: nothing the user writes is stored anywhere.

  async function submit() {
    const id = ++requestId.current;
    setStatus("loading");
    setSelected(null);
    setNote(undefined);
    setChecks({});
    try {
      const res = await composeMessage({
        intent: intent.trim(),
        relationship,
        tone,
        context: context.trim() || undefined,
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

  function select(i: number) {
    if (!result) return;
    if (selected === i) {
      setSelected(null);
      return;
    }
    setSelected(i);
    const candidate = result.candidates[i];
    const existing = checks[candidate.chinese];
    if (!existing || existing.status === "error") void runCheck(candidate, result);
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
    setTimeout(() => setCopied(false), 2000);
  }

  const selectedCandidate =
    result && selected !== null ? result.candidates[selected] : null;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span
              lang="zh-Hans"
              aria-hidden
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-lg font-medium text-white"
            >
              说
            </span>
            <h1 className="text-xl font-semibold tracking-tight text-ink">
              Mandarin Message Composer
            </h1>
          </div>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Say what you mean in natural Chinese, see how each version sounds,
            and check what it really says before you send it. Every line shows
            whether a real person has checked it.
          </p>
        </div>
        {source && <ModeBadge source={source} />}
      </header>

      <IntentForm
        intent={intent}
        relationship={relationship}
        tone={tone}
        context={context}
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
            <SectionTitle>Three ways to say it</SectionTitle>
            {note && (
              <p className="rounded-lg border border-accent/30 bg-accent-soft px-3 py-2 text-sm text-accent-deep">
                {note}
              </p>
            )}
            <div className="space-y-4">
              {result.candidates.map((c, i) => (
                <CandidateCard
                  key={c.label}
                  candidate={c}
                  selected={selected === i}
                  inDraft={draft.includes(c.chinese)}
                  onSelect={() => select(i)}
                  onAdd={() => addToDraft(c.chinese)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {selectedCandidate && result && (
        <MeaningCheck
          candidate={selectedCandidate}
          intent={result.intent}
          state={checks[selectedCandidate.chinese] ?? { status: "loading" }}
          onRetry={() => void runCheck(selectedCandidate, result)}
        />
      )}

      {(status === "ready" || draft.length > 0) && (
        <DraftTray
          lines={draft}
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
