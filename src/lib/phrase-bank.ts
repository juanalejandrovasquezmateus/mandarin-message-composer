// The verified phrase bank. Only entries with status "verified" are ever
// surfaced with a verified badge. Pending entries are ignored.
import bank from "@/data/verified-phrases.json";
import type {
  ComposeRequest,
  LanguageCode,
  Provenance,
  Region,
  Relationship,
  Tone,
} from "./types";

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

const PHRASES = bank as VerifiedPhrase[];

export function verifiedPhrases(): VerifiedPhrase[] {
  return PHRASES.filter((p) => p.verification.status === "verified");
}

/**
 * Finds the best verified phrase for a request, or null.
 * Needs at least two keyword hits, or one hit plus matching relationship.
 */
export function findVerifiedMatch(req: ComposeRequest): VerifiedPhrase | null {
  const text = req.intent.toLowerCase();
  let best: VerifiedPhrase | null = null;
  let bestScore = 0;
  for (const p of verifiedPhrases()) {
    const hits = p.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    if (hits === 0) continue;
    const relMatch = p.relationship === req.relationship;
    const toneMatch = p.tone === req.tone;
    if (hits < 2 && !relMatch) continue;
    const score = hits * 2 + (relMatch ? 2 : 0) + (toneMatch ? 1 : 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

const normalize = (s: string) => s.replace(/[\s，。！？、,.!?]/g, "");

export function provenanceFor(
  chinese: string,
  adaptedFromVerified: boolean,
  verified: VerifiedPhrase | null,
): Provenance {
  if (!verified) return "ai-generated";
  if (normalize(chinese) === normalize(verified.chinese)) {
    return verified.verification.level === "native"
      ? "verified-native"
      : "verified-community";
  }
  return adaptedFromVerified ? "ai-adapted" : "ai-generated";
}
