"use client";

import type { Candidate } from "@/lib/types";

interface Props {
  candidate: Candidate;
  intent: string;
}

export function MeaningCheck({ candidate, intent }: Props) {
  const noGap = candidate.gap.trim().toLowerCase() === "none";
  return (
    <section
      aria-label="Meaning check"
      className="rounded-2xl border border-line bg-card p-4 shadow-sm sm:p-5"
    >
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted">
        Meaning check
      </h3>
      <p lang="zh-Hans" className="mt-2 text-lg text-ink">
        {candidate.chinese}
      </p>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm font-medium text-ink">What it actually says</dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">
            {candidate.literalMeaning}
          </dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-ink">
            Compared with what you meant
          </dt>
          <dd className="mt-1 text-sm leading-relaxed text-muted">
            <span className="block text-xs italic text-muted/80">
              &ldquo;{intent}&rdquo;
            </span>
            <span
              className={`mt-1 block ${noGap ? "text-ok" : "text-ink"}`}
            >
              {noGap ? "No meaningful gap found." : candidate.gap}
            </span>
          </dd>
        </div>
      </dl>

      <p className="mt-4 rounded-lg bg-paper px-3 py-2 text-xs leading-relaxed text-muted">
        A reverse check helps catch mismatches. It doesn&rsquo;t prove the line
        is perfect. A native speaker is the final judge.
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
              <li
                key={v.word}
                className="flex items-baseline gap-3 py-2 text-sm"
              >
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
