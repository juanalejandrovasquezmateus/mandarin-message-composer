"use client";

import type { Candidate, Register, VerifyResult } from "@/lib/types";

export type VerifyState =
  | { status: "loading" }
  | { status: "ready"; result: VerifyResult }
  | { status: "error"; message: string };

interface Props {
  candidate: Candidate;
  intent: string;
  state: VerifyState;
  onRetry: () => void;
}

const REGISTERS: Register[] = ["casual", "neutral", "polite", "formal"];

export function MeaningCheck({ candidate, intent, state, onRetry }: Props) {
  return (
    <section
      aria-label="Meaning check"
      aria-busy={state.status === "loading"}
      className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5"
    >
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
        Meaning check
      </h3>
      <p lang="zh-Hans" className="mt-2 text-lg text-ink">
        {candidate.chinese}
      </p>

      {state.status === "loading" && (
        <div className="mt-4 animate-pulse space-y-3" role="status">
          <p className="text-sm text-muted">
            Reading the Chinese on its own first, then comparing it with what you meant…
          </p>
          <div className="h-3 w-5/6 rounded bg-line" />
          <div className="h-3 w-2/3 rounded bg-line" />
        </div>
      )}

      {state.status === "error" && (
        <p role="alert" className="mt-4 text-sm text-accent-deep">
          {state.message}{" "}
          <button
            type="button"
            onClick={onRetry}
            className="font-medium underline underline-offset-2"
          >
            Try again
          </button>
        </p>
      )}

      {state.status === "ready" && (
        <Ready result={state.result} intent={intent} />
      )}

      <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
        The literal reading is produced without seeing your English, so it can
        catch mismatches. It doesn&rsquo;t prove the line is perfect. A native
        speaker is the final judge.
      </p>

      {candidate.vocab.length > 0 && (
        <details className="group mt-3">
          <summary className="cursor-pointer select-none text-sm font-medium text-ink">
            Key words
            <span className="ml-1 text-muted group-open:hidden">(show)</span>
            <span className="ml-1 hidden text-muted group-open:inline">(hide)</span>
          </summary>
          <ul className="mt-2 divide-y divide-line">
            {candidate.vocab.map((v) => (
              <li key={v.word} className="flex items-baseline gap-3 py-2 text-sm">
                <span lang="zh-Hans" className="min-w-16 text-base text-ink">
                  {v.word}
                </span>
                <span className="min-w-20 text-muted">{v.pinyin}</span>
                <span className="text-ink">{v.meaning}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Ready({ result, intent }: { result: VerifyResult; intent: string }) {
  const noGap = result.gap.trim().toLowerCase() === "none";
  return (
    <dl className="mt-4 grid gap-4 sm:grid-cols-2">
      <div>
        <dt className="text-sm font-medium text-ink">What it actually says</dt>
        <dd className="mt-1 text-sm leading-relaxed text-muted">
          {result.literalMeaning}
        </dd>
        {result.register && <RegisterMeter value={result.register} />}
      </div>
      <div>
        <dt className="text-sm font-medium text-ink">Compared with what you meant</dt>
        <dd className="mt-1 text-sm leading-relaxed text-muted">
          <span className="block text-xs italic text-muted/80">&ldquo;{intent}&rdquo;</span>
          <span className={`mt-1 block ${noGap ? "text-ok" : "text-ink"}`}>
            {noGap ? "No meaningful gap found." : result.gap}
          </span>
        </dd>
      </div>
    </dl>
  );
}

function RegisterMeter({ value }: { value: Register }) {
  const idx = REGISTERS.indexOf(value);
  return (
    <div className="mt-3" aria-label={`Register: ${value}`}>
      <div className="flex gap-1">
        {REGISTERS.map((r, i) => (
          <span
            key={r}
            className={`h-1.5 flex-1 rounded-full ${i <= idx ? "bg-ink" : "bg-line"}`}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted">
        <span>casual</span>
        <span className="font-medium text-ink">{value}</span>
        <span>formal</span>
      </div>
    </div>
  );
}
