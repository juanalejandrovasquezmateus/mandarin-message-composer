// The verified phrase bank. Only entries with status "verified" are ever
// surfaced with a verified badge. Pending entries are ignored.
// Server-only (reads the JSON file at request time so reviewer approvals
// show up immediately).
import { readBank } from "./server/bank-store";
import type { ComposeRequest, Provenance, TargetLanguage, VerifiedPhrase } from "./types";

export type { VerifiedPhrase };

export async function verifiedPhrases(lang: TargetLanguage = "zh-Hans"): Promise<VerifiedPhrase[]> {
  const bank = await readBank(lang);
  return bank.filter((p) => p.verification.status === "verified");
}

/**
 * Finds the best verified phrase for a request, or null.
 * Deliberately strict: same relationship and at least two keyword hits, so an
 * approved line is only reused in the kind of situation it was approved for.
 * The model still decides whether it fits the exact intent.
 */
export async function findVerifiedMatch(
  req: ComposeRequest,
): Promise<VerifiedPhrase | null> {
  const text = req.intent.toLowerCase();
  let best: VerifiedPhrase | null = null;
  let bestScore = 0;
  for (const p of await verifiedPhrases(req.targetLanguage ?? "zh-Hans")) {
    if (p.relationship !== req.relationship) continue;
    const hits = p.keywords.filter((k) => text.includes(k.toLowerCase())).length;
    if (hits < 3) continue;
    const toneMatch = p.tone === req.tone;
    const score = hits * 2 + (toneMatch ? 1 : 0);
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

export const normalizeZh = (s: string) =>
  s.toLowerCase().replace(/[\s，。！？、,.!?~～¿¡]/g, "");

/** Rough overlap between two lines: characters for Chinese, words otherwise. 0..1 */
export function similarity(a: string, b: string): number {
  const toks = (s: string) => {
    const n = normalizeZh(s);
    return /\p{Script=Han}/u.test(n) ? [...n] : n.split(/\s+/).filter(Boolean);
  };
  const A = new Set(toks(a));
  const B = new Set(toks(b));
  if (A.size === 0 || B.size === 0) return 0;
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  return (2 * common) / (A.size + B.size);
}

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
