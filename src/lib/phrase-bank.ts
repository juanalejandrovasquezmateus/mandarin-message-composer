// The verified phrase bank. Only entries with status "verified" are ever
// surfaced with a verified badge. Pending entries are ignored.
// Server-only (reads the JSON file at request time so reviewer approvals
// show up immediately).
import { readBank } from "./server/bank-store";
import type { ComposeRequest, Provenance, VerifiedPhrase } from "./types";

export type { VerifiedPhrase };

export async function verifiedPhrases(): Promise<VerifiedPhrase[]> {
  const bank = await readBank();
  return bank.filter(
    (p) => p.verification.status === "verified" && p.targetLanguage === "zh-Hans",
  );
}

/**
 * Finds the best verified phrase for a request, or null.
 * Needs at least two keyword hits, or one hit plus matching relationship.
 */
export async function findVerifiedMatch(
  req: ComposeRequest,
): Promise<VerifiedPhrase | null> {
  const text = req.intent.toLowerCase();
  let best: VerifiedPhrase | null = null;
  let bestScore = 0;
  for (const p of await verifiedPhrases()) {
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

export const normalizeZh = (s: string) => s.replace(/[\s，。！？、,.!?~～]/g, "");

export function provenanceFor(
  chinese: string,
  adaptedFromVerified: boolean,
  verified: VerifiedPhrase | null,
): Provenance {
  if (!verified) return "ai-generated";
  if (normalizeZh(chinese) === normalizeZh(verified.chinese)) {
    return verified.verification.level === "native"
      ? "verified-native"
      : "verified-community";
  }
  return adaptedFromVerified ? "ai-adapted" : "ai-generated";
}
