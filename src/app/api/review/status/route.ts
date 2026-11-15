import { NextResponse } from "next/server";
import { readDecisions, readQueue } from "@/lib/server/bank-store";
import type { ReviewStatus } from "@/lib/types";

/** Live status of requested lines: ?ids=a,b,c -> queued | approved | rejected. */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^[0-9a-f-]{8,40}$/i.test(s))
    .slice(0, 20);
  if (ids.length === 0) return NextResponse.json({ statuses: [] });
  const [queue, decisions] = await Promise.all([readQueue(), readDecisions()]);
  const statuses: ReviewStatus[] = ids.map((id) => {
    if (queue.some((q) => q.id === id)) return { id, status: "queued" };
    const d = decisions.find((x) => x.id === id);
    return d ?? { id, status: "unknown" };
  });
  return NextResponse.json({ statuses });
}
