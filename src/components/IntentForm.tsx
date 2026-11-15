"use client";

import {
  INTENT_MAX_CHARS,
  RELATIONSHIPS,
  TONES,
  type Relationship,
  type Tone,
} from "@/lib/types";

interface Props {
  intent: string;
  relationship: Relationship;
  tone: Tone;
  loading: boolean;
  examples: { intent: string; relationship: Relationship; tone: Tone }[];
  onIntentChange: (v: string) => void;
  onRelationshipChange: (v: Relationship) => void;
  onToneChange: (v: Tone) => void;
  onPickExample: (ex: { intent: string; relationship: Relationship; tone: Tone }) => void;
  onSubmit: () => void;
}

export function IntentForm(p: Props) {
  const remaining = INTENT_MAX_CHARS - p.intent.length;
  const canSubmit = p.intent.trim().length >= 3 && !p.loading;

  return (
    <form
      className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) p.onSubmit();
      }}
    >
      <label htmlFor="intent" className="block text-sm font-medium text-ink">
        What do you want to say?
      </label>
      <p className="mt-1 text-sm text-muted">
        Write it in English, the way you&rsquo;d explain it to a friend.
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
      <div className="mt-1 flex justify-end">
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

      <div className="mt-6 flex items-center justify-between gap-3">
        <p className="hidden text-xs text-muted sm:block">
          Ctrl + Enter to compose
        </p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-40"
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
                  ? "border-ink bg-ink text-paper"
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
