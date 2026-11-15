"use client";

import { CANDIDATE_LABELS, type Candidate } from "@/lib/types";
import { ProvenanceBadge } from "./ProvenanceBadge";

export type ReviewRequestState =
  | "idle"
  | "sending"
  | "sent"
  | "verified"
  | "approved"
  | "changed"
  | "rejected"
  | "error";

export interface ReviewInfo {
  state: ReviewRequestState;
  /** Extra line shown under the badge, e.g. who approved it. */
  detail?: string;
  onRequest: () => void;
}

interface Props {
  candidate: Candidate;
  selected: boolean;
  inDraft: boolean;
  onSelect: () => void;
  onAdd: () => void;
  /** Present only when a human check can be requested (live results). */
  review?: ReviewInfo;
}

const REVIEW_LABEL: Record<ReviewRequestState, string> = {
  idle: "Request a human check",
  sending: "Sending…",
  sent: "Waiting for a reviewer…",
  verified: "Already checked",
  approved: "Approved by the reviewer",
  changed: "Approved with a change",
  rejected: "Rejected by the reviewer",
  error: "Couldn't send. Tap to retry",
};

const SETTLED: ReviewRequestState[] = ["sending", "sent", "verified", "approved", "changed", "rejected"];

export function CandidateCard({
  candidate,
  selected,
  inDraft,
  onSelect,
  onAdd,
  review,
}: Props) {
  const meta = CANDIDATE_LABELS[candidate.label];
  const unverified =
    candidate.provenance === "ai-generated" ||
    candidate.provenance === "ai-adapted" ||
    candidate.provenance === "user-submitted";
  const canRequest = review && (unverified || review.state !== "idle");
  const good = review && ["sent", "verified", "approved", "changed"].includes(review.state);
  return (
    <article
      className={`rounded-2xl border bg-card p-4 shadow-sm transition-colors sm:p-5 ${
        selected ? "border-accent ring-2 ring-accent/15" : "border-line"
      }`}
    >
      <header className="flex items-baseline justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              selected ? "bg-accent" : "bg-line-strong"
            }`}
          />
          {meta.title}
        </span>
        <span className="text-xs text-muted">{meta.blurb}</span>
      </header>

      <p
        lang="zh-Hans"
        className="mt-3 text-2xl leading-snug text-ink sm:text-[1.75rem]"
      >
        {candidate.chinese}
      </p>
      <p className="mt-1.5 text-sm text-muted">{candidate.pinyin}</p>
      <p className="mt-3 text-base text-ink">{candidate.english}</p>
      <p className="mt-2 border-l-2 border-line pl-3 text-sm leading-relaxed text-muted">
        {candidate.nuance}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <ProvenanceBadge
          provenance={candidate.provenance}
          note={candidate.verifierNote}
        />
        {canRequest && (
          <button
            type="button"
            onClick={review.onRequest}
            disabled={SETTLED.includes(review.state)}
            title="Sends this line and your English intent to a native-speaking reviewer."
            className={`text-xs underline-offset-2 ${
              good
                ? "text-ok"
                : review.state === "rejected" || review.state === "error"
                  ? "text-accent-deep"
                  : "text-muted hover:text-ink hover:underline"
            } ${review.state === "error" ? "underline" : ""} disabled:cursor-default`}
          >
            {review.state === "sent" && (
              <span aria-hidden className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ok align-middle" />
            )}
            {(review.state === "approved" || review.state === "changed") && "✓ "}
            {REVIEW_LABEL[review.state]}
          </button>
        )}
      </div>
      {review?.detail && (
        <p className="mt-2 text-xs leading-relaxed text-muted">{review.detail}</p>
      )}

      <footer className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
            selected
              ? "border-accent bg-accent-soft text-accent-deep"
              : "border-line text-ink hover:border-line-strong"
          }`}
        >
          {selected ? "Checking meaning" : "Check meaning"}
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={inDraft}
          className="rounded-full bg-ink px-3.5 py-1.5 text-sm text-paper transition-colors hover:bg-black disabled:cursor-default disabled:bg-ok-soft disabled:text-ok"
        >
          {inDraft ? "In your draft" : "Add to draft"}
        </button>
      </footer>
    </article>
  );
}

export function CandidateSkeleton() {
  return (
    <div
      aria-hidden
      className="animate-pulse rounded-2xl border border-line bg-card p-4 sm:p-5"
    >
      <div className="h-3 w-24 rounded bg-line" />
      <div className="mt-4 h-7 w-3/4 rounded bg-line" />
      <div className="mt-2 h-3 w-1/2 rounded bg-line" />
      <div className="mt-4 h-4 w-2/3 rounded bg-line" />
      <div className="mt-2 h-3 w-full rounded bg-line" />
      <div className="mt-5 flex gap-2">
        <div className="h-8 w-28 rounded-full bg-line" />
        <div className="h-8 w-24 rounded-full bg-line" />
      </div>
    </div>
  );
}
