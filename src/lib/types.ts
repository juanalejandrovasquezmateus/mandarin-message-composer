// Shared types for the composer. Demo Mode data, the phrase bank and the live
// AI response must all match these shapes.

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
export const CONTEXT_MAX_CHARS = 120;

/** Language pair. Only en -> zh-Hans is built today; the fields exist so a
 *  second direction is configuration later, not a rewrite. */
export type LanguageCode = "en" | "zh-Hans" | "es";
export type TargetLanguage = "zh-Hans" | "es";
export type Region = "mainland" | "taiwan" | "other";

export const TARGET_LANGUAGES: Record<
  TargetLanguage,
  { name: string; adjective: string; hasPinyin: boolean; checkerLabel: string }
> = {
  "zh-Hans": { name: "Chinese", adjective: "Chinese", hasPinyin: true, checkerLabel: "native Chinese speaker" },
  es: { name: "Spanish", adjective: "Spanish", hasPinyin: false, checkerLabel: "native Spanish speaker" },
};

export type CandidateLabel = "direct" | "natural" | "fitted" | "own";

export const CANDIDATE_LABELS: Record<
  CandidateLabel,
  { title: string; blurb: string }
> = {
  direct: { title: "Direct", blurb: "Closest to your English" },
  natural: { title: "Natural", blurb: "How people actually text it" },
  fitted: { title: "Fitted to tone", blurb: "Shaped for who it's for" },
  own: { title: "Your wording", blurb: "Written by you" },
};

/** Where a line came from. Shown on every candidate, always truthfully. */
export type Provenance =
  | "verified-native"
  | "verified-community"
  | "ai-adapted"
  | "ai-generated"
  | "user-submitted";

export const PROVENANCE_LABELS: Record<
  Provenance,
  { title: string; detail: string }
> = {
  "verified-native": {
    title: "Checked by a native speaker",
    detail: "This exact line was reviewed and approved by a native Chinese speaker.",
  },
  "verified-community": {
    title: "Checked by a community member",
    detail: "A native-speaking user approved this line. Not yet reviewed by our official checker.",
  },
  "ai-adapted": {
    title: "AI-adapted from a checked phrase",
    detail: "The AI changed a line a native speaker had approved. The changes are not checked.",
  },
  "ai-generated": {
    title: "AI-generated, not yet checked",
    detail: "No human has reviewed this line.",
  },
  "user-submitted": {
    title: "Written by a user, not yet checked",
    detail: "A user wrote this line themselves. No reviewer has approved it yet.",
  },
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
  vocab: VocabItem[];
  provenance: Provenance;
  /** Reviewer's note, when the line comes from the verified bank. */
  verifierNote?: string;
  /** Pre-computed meaning check (Demo Mode only). Live results fetch it. */
  literalMeaning?: string;
  gap?: string;
}

export interface ComposeRequest {
  intent: string;
  relationship: Relationship;
  tone: Tone;
  /** Optional free text, e.g. "she's my host mom, speaks no English". */
  context?: string;
  /** Language the message should be in. Defaults to Chinese. */
  targetLanguage?: TargetLanguage;
}

export interface ComposeResult extends ComposeRequest {
  id: string;
  sourceLanguage: LanguageCode;
  targetLanguage: TargetLanguage;
  candidates: Candidate[];
}

/** Where a result came from. "demo" must always be shown to the user. */
export type ResultSource = "demo" | "live";

export type Register = "casual" | "neutral" | "polite" | "formal";

export interface VerifyRequest {
  chinese: string;
  intent: string;
  relationship: Relationship;
  tone: Tone;
  targetLanguage?: TargetLanguage;
}

/** One entry in the phrase bank (src/data/verified-phrases.json). */
export interface VerifiedPhrase {
  id: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  intent: string;
  keywords: string[];
  relationship: Relationship;
  tone: Tone;
  context: string;
  region: Region;
  chinese: string;
  pinyin: string;
  english: string;
  nuance: string;
  verification: {
    status: "pending" | "verified" | "rejected";
    level: "native" | "community";
    verifiedBy: string;
    note: string;
    date: string;
  };
}

/** A line a user asked a human to check (src/data/review-queue.json). */
export interface ReviewRequestItem {
  id: string;
  chinese: string;
  pinyin: string;
  english: string;
  intent: string;
  relationship: Relationship;
  tone: Tone;
  context?: string;
  region: Region;
  provenance: Provenance;
  submittedAt: string;
  targetLanguage?: TargetLanguage;
}

export type ReviewDecision = "keep" | "fix" | "reject";
export type ReviewerLevel = "native" | "community";

/** Outcome of a review request, polled live by the page that asked. */
export type ReviewStatus =
  | { id: string; status: "queued" }
  | { id: string; status: "unknown" }
  | { id: string; status: "rejected"; date: string }
  | {
      id: string;
      status: "approved";
      chinese: string;
      pinyin: string;
      changed: boolean;
      level: ReviewerLevel;
      verifiedBy: string;
      note: string;
      date: string;
    };

export interface VerifyResult {
  /** What the Chinese literally says, produced without seeing the English. */
  literalMeaning: string;
  /** How it reads: casual ... formal. Absent for hand-written Demo Mode checks. */
  register?: Register;
  /** How the Chinese differs from the intent, or "none". */
  gap: string;
}
