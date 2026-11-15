import { NextResponse } from "next/server";
import { verifyRequestSchema } from "@/lib/schemas";
import { hasProvider, providerErrorReason, verifyCandidate } from "@/lib/server/ai";
import { allowRequest, cacheGet, cacheSet, clientIp } from "@/lib/server/limits";
import type { VerifyResult } from "@/lib/types";

export async function POST(req: Request) {
  if (!hasProvider()) {
    return NextResponse.json({ error: "no_provider" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = verifyRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const request = parsed.data;

  if (!allowRequest(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const key =
    "verify:" +
    JSON.stringify([
      request.chinese,
      request.intent.toLowerCase(),
      request.relationship,
      request.tone,
    ]);
  const cached = cacheGet<VerifyResult>(key);
  if (cached) return NextResponse.json({ result: cached, cached: true });

  try {
    const result = await verifyCandidate(request);
    cacheSet(key, result);
    return NextResponse.json({ result });
  } catch (err) {
    const { status, reason } = providerErrorReason(err);
    console.error("[verify] provider failure:", reason, err instanceof Error ? err.message : "");
    return NextResponse.json({ error: reason }, { status });
  }
}
