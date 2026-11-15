import { NextResponse } from "next/server";
import { readAllBanks, readQueue } from "@/lib/server/bank-store";
import {
  officialReviewerName,
  reviewerConfigured,
  reviewerLevelFor,
} from "@/lib/server/reviewer-auth";

/** Reviewer loads the queue. Needs the x-reviewer-code header. */
export async function GET(req: Request) {
  if (!reviewerConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const level = reviewerLevelFor(req);
  if (!level) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const [items, bank] = await Promise.all([readQueue(), readAllBanks()]);
  const verifiedCount = bank.filter((b) => b.verification.status === "verified").length;
  return NextResponse.json({
    level,
    items,
    verifiedCount,
    officialName: level === "native" ? officialReviewerName("zh-Hans") : null,
    officialNameEs: level === "native" ? officialReviewerName("es") : null,
  });
}
