// Shared reviewer codes, set in .env.local. REVIEWER_CODE is the official
// native checker; COMMUNITY_CODE (optional) marks lines as community-checked.
import type { ReviewerLevel, TargetLanguage } from "../types";

export function reviewerLevelFor(req: Request): ReviewerLevel | null {
  const code = req.headers.get("x-reviewer-code")?.trim();
  if (!code) return null;
  const official = process.env.REVIEWER_CODE?.trim();
  const community = process.env.COMMUNITY_CODE?.trim();
  if (official && code === official) return "native";
  if (community && code === community) return "community";
  return null;
}

export function reviewerConfigured(): boolean {
  return Boolean(process.env.REVIEWER_CODE?.trim());
}

/** The official checker's name is fixed in the environment, not typed.
 *  One per target language: REVIEWER_NAME (Chinese), REVIEWER_NAME_ES (Spanish). */
export function officialReviewerName(lang: TargetLanguage = "zh-Hans"): string | null {
  const v = lang === "es" ? process.env.REVIEWER_NAME_ES : process.env.REVIEWER_NAME;
  return v?.trim() || null;
}

export function resolveReviewerName(
  level: ReviewerLevel,
  submitted: string,
  lang: TargetLanguage = "zh-Hans",
): string {
  if (level === "native") return officialReviewerName(lang) ?? submitted;
  return submitted;
}
