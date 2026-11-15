import { NextResponse } from "next/server";
import { normalizeZh, verifiedPhrases } from "@/lib/phrase-bank";
import { reviewRequestSchema } from "@/lib/schemas";
import { readQueue, writeQueue } from "@/lib/server/bank-store";
import { allowRequest, clientIp } from "@/lib/server/limits";
import type { ReviewRequestItem } from "@/lib/types";

const QUEUE_MAX = 200;

/** A user asks a human to check a line. Sends the line and their intent. */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = reviewRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!allowRequest(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const item = parsed.data;
  const key = normalizeZh(item.chinese);

  if ((await verifiedPhrases()).some((p) => normalizeZh(p.chinese) === key)) {
    return NextResponse.json({ status: "already_verified" });
  }
  const queue = await readQueue();
  if (queue.some((q) => normalizeZh(q.chinese) === key)) {
    return NextResponse.json({ status: "already_queued", position: queue.length });
  }
  if (queue.length >= QUEUE_MAX) {
    return NextResponse.json({ error: "queue_full" }, { status: 503 });
  }
  const entry: ReviewRequestItem = {
    id: crypto.randomUUID(),
    ...item,
    region: "mainland",
    provenance: "ai-generated",
    submittedAt: new Date().toISOString(),
  };
  queue.push(entry);
  await writeQueue(queue);
  return NextResponse.json({ status: "queued", position: queue.length });
}
