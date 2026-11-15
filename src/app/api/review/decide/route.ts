import { NextResponse } from "next/server";
import { keywordsFor } from "@/lib/keywords";
import { reviewDecideSchema } from "@/lib/schemas";
import { hasProvider, providerErrorReason, screenEdit } from "@/lib/server/ai";
import { appendToBank, readQueue, removeFromQueue } from "@/lib/server/bank-store";
import { cacheClear } from "@/lib/server/limits";
import { toPinyin } from "@/lib/server/pinyin";
import {
  resolveReviewerName,
  reviewerConfigured,
  reviewerLevelFor,
} from "@/lib/server/reviewer-auth";
import type { VerifiedPhrase } from "@/lib/types";

/**
 * Reviewer decides on a queued line: keep, fix or reject.
 * Both keep and fix pass the AI screen before entering the bank.
 */
export async function POST(req: Request) {
  if (!reviewerConfigured()) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }
  const level = reviewerLevelFor(req);
  if (!level) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = reviewDecideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const d = parsed.data;

  const item = (await readQueue()).find((q) => q.id === d.id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  if (d.decision === "reject") {
    await removeFromQueue(d.id);
    return NextResponse.json({ status: "rejected" });
  }

  const chinese = d.decision === "fix" ? (d.chineseFixed?.trim() ?? "") : item.chinese;
  if (!chinese) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  if (!hasProvider()) {
    return NextResponse.json({ error: "no_provider" }, { status: 503 });
  }
  try {
    const verdict = await screenEdit({
      original: item.chinese,
      fixed: chinese,
      intent: item.intent,
      english: item.english,
    });
    if (!verdict.ok) {
      return NextResponse.json(
        { error: "screen_failed", reason: verdict.reason },
        { status: 422 },
      );
    }
  } catch (err) {
    const { status, reason } = providerErrorReason(err);
    console.error("[review/decide] screen failure:", reason);
    return NextResponse.json({ error: reason }, { status });
  }

  const entry: VerifiedPhrase = {
    id: `q-${item.id.slice(0, 8)}`,
    sourceLanguage: "en",
    targetLanguage: "zh-Hans",
    intent: item.intent,
    keywords: keywordsFor(item.intent, item.english),
    relationship: item.relationship,
    tone: d.tone ?? item.tone,
    context: d.context ?? item.context ?? "",
    region: d.region ?? item.region,
    chinese,
    pinyin: toPinyin(chinese),
    english: item.english,
    nuance: d.note ?? "",
    verification: {
      status: "verified",
      level,
      verifiedBy: resolveReviewerName(level, d.reviewerName),
      note: d.note ?? "",
      date: new Date().toISOString().slice(0, 10),
    },
  };
  await appendToBank(entry);
  await removeFromQueue(d.id);
  // Cached compositions may now have a verified match; drop them.
  cacheClear("compose:");
  return NextResponse.json({ status: "verified", entry });
}
