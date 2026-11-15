"use client";

interface Props {
  lines: string[];
  copied: boolean;
  onRemove: (index: number) => void;
  onClear: () => void;
  onCopy: () => void;
}

export function joinDraft(lines: string[]) {
  return lines.join("");
}

export function DraftTray({ lines, copied, onRemove, onClear, onCopy }: Props) {
  const text = joinDraft(lines);
  return (
    <section
      aria-label="Your message"
      className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
          Your message
        </h3>
        {lines.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-muted underline-offset-2 hover:underline"
          >
            Clear
          </button>
        )}
      </div>

      {lines.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Add lines from the cards above to build the message you&rsquo;ll send.
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-1.5">
            {lines.map((line, i) => (
              <li
                key={`${i}-${line}`}
                className="flex items-start justify-between gap-3 rounded-lg bg-paper px-3 py-2"
              >
                <span lang="zh-Hans" className="text-base text-ink">
                  {line}
                </span>
                <button
                  type="button"
                  onClick={() => onRemove(i)}
                  aria-label="Remove line"
                  className="shrink-0 text-xs text-muted hover:text-accent"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <p
            lang="zh-Hans"
            className="mt-4 rounded-xl border border-line px-4 py-3 text-lg leading-relaxed text-ink"
          >
            {text}
          </p>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={onCopy}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                copied
                  ? "bg-ok-soft text-ok"
                  : "bg-accent text-white hover:bg-accent-deep"
              }`}
            >
              {copied ? "Copied" : "Copy message"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
