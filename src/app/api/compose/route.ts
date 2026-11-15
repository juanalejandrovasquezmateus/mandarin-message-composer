import { NextResponse } from "next/server";
import { findVerifiedMatch, provenanceFor } from "@/lib/phrase-bank";
import { composeRequestSchema } from "@/lib/schemas";
import { generateCandidates, hasProvider, providerErrorReason } from "@/lib/server/ai";
import { allowRequest, cacheGet, cacheSet, clientIp } from "@/lib/server/limits";
import type { Candidate, ComposeResult } from "@/lib/types";

export async function POST(req: Request) {
  if (!hasProvider()) {
    return NextResponse.json({ error: "no_provider" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  const parsed = composeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const request = parsed.data;

  if (!allowRequest(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const key =
    "compose:" +
    JSON.stringify([
      request.intent.toLowerCase(),
      request.relationship,
      request.tone,
      (request.context ?? "").toLowerCase(),
    ]);
  const cached = cacheGet<ComposeResult>(key);
  if (cached) return NextResponse.json({ result: cached, cached: true });

  const verified = findVerifiedMatch(request);

  try {
    const model = await generateCandidates(request, verified);
    const candidates: Candidate[] = model.candidates.slice(0, 3).map((c) => {
      const provenance = provenanceFor(c.chinese, c.adaptedFromVerified, verified);
      return {
        label: c.label,
        chinese: c.chinese.trim(),
        pinyin: c.pinyin.trim(),
        english: c.english.trim(),
        nuance: c.nuance.trim(),
        vocab: c.vocab.slice(0, 4),
        provenance,
        verifierNote:
          provenance.startsWith("verified") && verified?.verification.note
            ? verified.verification.note
            : undefined,
      };
    });
    if (candidates.length !== 3) {
      return NextResponse.json({ error: "provider_error" }, { status: 502 });
    }
    const result: ComposeResult = {
      id: crypto.randomUUID(),
      ...request,
      sourceLanguage: "en",
      targetLanguage: "zh-Hans",
      candidates,
    };
    cacheSet(key, result);
    return NextResponse.json({ result });
  } catch (err) {
    const { status, reason } = providerErrorReason(err);
    // Log the failure type only; never the user's message.
    console.error("[compose] provider failure:", reason, err instanceof Error ? err.message : "");
    return NextResponse.json({ error: reason }, { status });
  }
}
