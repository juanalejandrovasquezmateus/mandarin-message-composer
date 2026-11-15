// Shared reviewer codes, set in .env.local. REVIEWER_CODE is the official
// native checker; COMMUNITY_CODE (optional) marks lines as community-checked.
import type { ReviewerLevel } from "../types";

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
