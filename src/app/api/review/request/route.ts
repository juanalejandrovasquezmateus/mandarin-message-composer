import { NextResponse } from "next/server";
import { normalizeZh, verifiedPhrases } from "@/lib/phrase-bank";
import { reviewRequestSchema } from "@/lib/schemas";
import { readQueue, writeQueue } from "@/lib/server/bank-store";
import { allowRequest, clientIp } from "@/lib/server/limits";
import { toPinyin } from "@/lib/server/pinyin";
import type { ReviewRequestItem } from "@/lib/types";

const QUEUE_MAX = 200;

/**
 * A user asks a human to check a line (an AI candidate or their own wording).
 * Sends the line and their intent. Returns an id the page can poll.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = reviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!allowRequest(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { source, ...item } = parsed.data;
  const lang = item.targetLanguage;
  const key = normalizeZh(item.chinese);

  const existing = (await verifiedPhrases(lang)).find((p) => normalizeZh(p.chinese) === key);
  if (existing) {
    return NextResponse.json({
      status: "already_verified",
      level: existing.verification.level,
      verifiedBy: existing.verification.verifiedBy,
    });
  }
  const queue = await readQueue();
  const dup = queue.find((q) => normalizeZh(q.chinese) === key);
  if (dup) {
    return NextResponse.json({ status: "already_queued", id: dup.id, position: queue.length });
  }
  if (queue.length >= QUEUE_MAX) {
    return NextResponse.json({ error: "queue_full" }, { status: 503 });
  }
  const entry: ReviewRequestItem = {
    id: crypto.randomUUID(),
    chinese: item.chinese,
    pinyin: lang === "zh-Hans" ? item.pinyin || toPinyin(item.chinese) : "",
    english: item.english || item.intent,
    intent: item.intent,
    relationship: item.relationship,
    tone: item.tone,
    context: item.context,
    region: lang === "es" ? "other" : "mainland",
    provenance: source === "user" ? "user-submitted" : "ai-generated",
    submittedAt: new Date().toISOString(),
    targetLanguage: lang,
  };
  queue.push(entry);
  await writeQueue(queue);
  return NextResponse.json({ status: "queued", id: entry.id, position: queue.length });
}
