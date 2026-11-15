import { NextResponse } from "next/server";
import { findVerifiedMatch, normalizeZh, provenanceFor } from "@/lib/phrase-bank";
import { composeRequestSchema } from "@/lib/schemas";
import { generateCandidates, hasProvider, providerErrorReason } from "@/lib/server/ai";
import { allowRequest, cacheGet, cacheSet, clientIp } from "@/lib/server/limits";
import { toPinyin } from "@/lib/server/pinyin";
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

  const key =
    "compose:" +
    JSON.stringify([
      request.intent.toLowerCase(),
      request.relationship,
      request.tone,
      (request.context ?? "").toLowerCase(),
    ]);
  // Cached answers are free, so they don't count against the visitor's limit.
  const cached = cacheGet<ComposeResult>(key);
  if (cached) return NextResponse.json({ result: cached, cached: true });

  if (!allowRequest(clientIp(req))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const verified = await findVerifiedMatch(request);

  try {
    const model = await generateCandidates(request, verified);
    let raw = model.candidates.slice(0, 3);
    if (verified) {
      const verbatim = raw.some((c) => normalizeZh(c.chinese) === normalizeZh(verified.chinese));
      const used = raw.some((c) => c.adaptedFromVerified);
      if (!verbatim && used) {
        // The model judged the approved line relevant but paraphrased it. The point
        // of the bank is to show the approved wording, so restore it verbatim as
        // the "natural" candidate. Vocab is left empty rather than mismatched.
        raw = raw.map((c) =>
          c.label === "natural"
            ? {
                label: "natural" as const,
                chinese: verified.chinese,
                pinyin: verified.pinyin,
                english: verified.english,
                nuance: verified.nuance || c.nuance,
                vocab: [],
                adaptedFromVerified: false,
              }
            : c,
        );
      }
    }
    const candidates: Candidate[] = raw.map((c) => {
      const provenance = provenanceFor(c.chinese, c.adaptedFromVerified, verified);
      return {
        label: c.label,
        chinese: c.chinese.trim(),
        // Pinyin comes from the library, not the model (tone marks are reliable).
        pinyin: toPinyin(c.chinese.trim()),
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
    const usedVerified = candidates.some((c) => c.provenance.startsWith("verified"));
    // Diagnostic only: ids, never message content.
    console.log(`[compose] bank match: ${verified?.id ?? "none"}; shown verbatim: ${usedVerified}`);
    return NextResponse.json({
      result,
      verifiedMatch: verified ? { id: verified.id, used: usedVerified } : null,
    });
  } catch (err) {
    const { status, reason } = providerErrorReason(err);
    // Log the failure type only; never the user's message.
    console.error("[compose] provider failure:", reason, err instanceof Error ? err.message : "");
    return NextResponse.json({ error: reason }, { status });
  }
}
