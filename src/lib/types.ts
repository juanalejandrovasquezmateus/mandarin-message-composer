// Shared types for the composer. Both Demo Mode data and (in Phase 2) the
// live AI response must match these shapes.

export const RELATIONSHIPS = [
  { id: "friend", label: "Friend" },
  { id: "classmate", label: "Classmate" },
  { id: "family", label: "Family" },
  { id: "teacher", label: "Teacher or elder" },
] as const;

export const TONES = [
  { id: "casual", label: "Casual" },
  { id: "friendly", label: "Friendly" },
  { id: "polite", label: "Polite" },
  { id: "appreciative", label: "Appreciative" },
] as const;

export type Relationship = (typeof RELATIONSHIPS)[number]["id"];
export type Tone = (typeof TONES)[number]["id"];

export const INTENT_MAX_CHARS = 300;

export type CandidateLabel = "direct" | "natural" | "fitted";

export const CANDIDATE_LABELS: Record<
  CandidateLabel,
  { title: string; blurb: string }
> = {
  direct: { title: "Direct", blurb: "Closest to your English" },
  natural: { title: "Natural", blurb: "How people actually text it" },
  fitted: { title: "Fitted to tone", blurb: "Shaped for who it's for" },
};

export interface VocabItem {
  word: string;
  pinyin: string;
  meaning: string;
}

export interface Candidate {
  label: CandidateLabel;
  chinese: string;
  pinyin: string;
  english: string;
  /** One or two sentences on how this line sounds to a native speaker. */
  nuance: string;
  /** What the Chinese literally says, in English (the reverse check). */
  literalMeaning: string;
  /** How the Chinese differs from the original intent, or "none". */
  gap: string;
  vocab: VocabItem[];
}

export interface ComposeRequest {
  intent: string;
  relationship: Relationship;
  tone: Tone;
}

export interface ComposeResult extends ComposeRequest {
  id: string;
  candidates: Candidate[];
}

/** Where a result came from. "demo" must always be shown to the user. */
export type ResultSource = "demo" | "live";
