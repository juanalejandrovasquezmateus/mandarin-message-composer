"use client";

import {
  CONTEXT_MAX_CHARS,
  INTENT_MAX_CHARS,
  RELATIONSHIPS,
  TARGET_LANGUAGES,
  TONES,
  type Relationship,
  type TargetLanguage,
  type Tone,
} from "@/lib/types";

export interface Example {
  intent: string;
  relationship: Relationship;
  tone: Tone;
}

interface Props {
  intent: string;
  relationship: Relationship;
  tone: Tone;
  context: string;
  lang: TargetLanguage;
  loading: boolean;
  examples: Example[];
  onIntentChange: (v: string) => void;
  onRelationshipChange: (v: Relationship) => void;
  onToneChange: (v: Tone) => void;
  onContextChange: (v: string) => void;
  onLangChange: (v: TargetLanguage) => void;
  onPickExample: (ex: Example) => void;
  onSurprise: () => void;
  onSubmit: () => void;
}

export function IntentForm(p: Props) {
  const remaining = INTENT_MAX_CHARS - p.intent.length;
  const canSubmit = p.intent.trim().length >= 3 && !p.loading;
  const L = TARGET_LANGUAGES[p.lang];

  return (
    <form
      className="glass rounded-2xl border border-line p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) p.onSubmit();
      }}
    >
      <fieldset className="flex flex-wrap items-center gap-3">
        <legend className="sr-only">Language you are learning</legend>
        <span className="text-xs font-medium uppercase tracking-wide text-muted">I&rsquo;m learning</span>
        <div className="inline-flex rounded-full border border-line bg-paper p-0.5">
          {(Object.keys(TARGET_LANGUAGES) as TargetLanguage[]).map((code) => {
            const active = code === p.lang;
            return (
              <button
                key={code}
                type="button"
                aria-pressed={active}
                onClick={() => p.onLangChange(code)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                  active ? "bg-ink text-night" : "text-muted hover:text-ink"
                }`}
              >
                {code === "zh-Hans" ? (
                  <>
                    <span lang="zh-Hans">中文</span> Chinese
                  </>
                ) : (
                  <>
                    <span lang="es">Español</span> Spanish
                  </>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label htmlFor="intent" className="mt-5 block text-sm font-medium text-ink">
        What do you want to say?
      </label>
      <p className="mt-1 text-sm text-muted">
        Write it in English or Spanish, the way you&rsquo;d explain it to a friend.
        You&rsquo;ll get three ways to say it in {L.name}.
      </p>
      <textarea
        id="intent"
        value={p.intent}
        onChange={(e) =>
          p.onIntentChange(e.target.value.slice(0, INTENT_MAX_CHARS))
        }
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
            e.preventDefault();
            p.onSubmit();
          }
        }}
        rows={3}
        placeholder="e.g. Thank my friend for helping me with homework, without sounding too formal"
        className="mt-3 w-full resize-none rounded-xl border border-line bg-paper px-4 py-3 text-base leading-relaxed text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      <div className="mt-1 flex items-center justify-between">
        <button
          type="button"
          onClick={p.onSurprise}
          className="text-xs text-muted underline-offset-2 hover:text-ink hover:underline"
          title="Fills the box with a common everyday situation to practise."
        >
          Give me a common situation
        </button>
        <span
          className={`text-xs ${remaining < 30 ? "text-accent" : "text-muted"}`}
        >
          {remaining} left
        </span>
      </div>

      {p.intent.trim().length === 0 && (
        <div className="mt-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Try an example
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {p.examples.map((ex) => (
              <button
                key={ex.intent}
                type="button"
                onClick={() => p.onPickExample(ex)}
                className="rounded-full border border-dashed border-line-strong px-3 py-1.5 text-left text-sm text-ink transition-colors hover:border-accent hover:bg-accent-soft"
              >
                {ex.intent}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <ChipGroup
          label="Who is it for?"
          options={RELATIONSHIPS}
          value={p.relationship}
          onChange={(v) => p.onRelationshipChange(v as Relationship)}
        />
        <ChipGroup
          label="How should it sound?"
          options={TONES}
          value={p.tone}
          onChange={(v) => p.onToneChange(v as Tone)}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="context" className="text-xs font-medium uppercase tracking-wide text-muted">
          Anything else worth knowing? <span className="normal-case">(optional)</span>
        </label>
        <input
          id="context"
          type="text"
          value={p.context}
          maxLength={CONTEXT_MAX_CHARS}
          onChange={(e) => p.onContextChange(e.target.value)}
          placeholder="e.g. she's my host mom and speaks no English"
          className="mt-2 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="hidden text-xs text-muted sm:block">
          Ctrl + Enter to compose
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white shadow-[0_0_18px_rgba(255,61,127,0.45)] transition-all hover:bg-accent-deep hover:shadow-[0_0_26px_rgba(255,61,127,0.6)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {p.loading ? "Composing…" : "Find ways to say it"}
        </button>
      </div>
    </form>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                active
                  ? "border-ink bg-ink text-night"
                  : "border-line bg-card text-ink hover:border-line-strong"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
