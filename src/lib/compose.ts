// Browser-side calls to our own API routes, with an honest Demo Mode fallback.
import { matchDemo } from "./demo-data";
import type {
  Candidate,
  ComposeRequest,
  ComposeResult,
  ResultSource,
  VerifyRequest,
  VerifyResult,
} from "./types";

export interface ComposeResponse {
  result: ComposeResult;
  source: ResultSource;
  /** Shown to the user when the result needs a caveat. */
  note?: string;
}

/** An error worth showing to the user instead of falling back to Demo Mode. */
export class UserFacingError extends Error {}

const REASONS: Record<string, string> = {
  no_provider: "no AI key is configured on the server",
  bad_key: "the server's AI key was rejected",
  provider_busy: "the AI service is busy right now",
  unreachable: "the AI service couldn't be reached",
  provider_error: "the AI service returned an error",
  refused: "the AI declined this request",
  unknown: "something went wrong on the server",
};

export async function composeMessage(req: ComposeRequest): Promise<ComposeResponse> {
  let reason = "unreachable";
  try {
    const r = await fetch("/api/compose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
    if (r.ok) {
      const data = (await r.json()) as { result: ComposeResult };
      return { result: data.result, source: "live" };
    }
    if (r.status === 429) {
      throw new UserFacingError(
        "You've sent a lot of requests in a short time. Wait a few minutes and try again.",
      );
    }
    if (r.status === 400) {
      throw new UserFacingError("Please write a few more words about what you want to say.");
    }
    const data = (await r.json().catch(() => ({}))) as { error?: string };
    reason = data.error ?? "unknown";
  } catch (e) {
    if (e instanceof UserFacingError) throw e;
  }
  return demoFallback(req, reason);
}

async function demoFallback(req: ComposeRequest, reason: string): Promise<ComposeResponse> {
  await new Promise((r) => setTimeout(r, 500));
  const { result, matched } = matchDemo(req);
  const why = REASONS[reason] ?? REASONS.unknown;
  const note =
    `Live AI is unavailable (${why}). Showing a prepared Demo Mode example` +
    (matched ? "." : ": the closest one to your words, not a response to them.");
  return { result, source: "demo", note };
}

export async function verifyLine(
  candidate: Candidate,
  req: VerifyRequest,
): Promise<VerifyResult> {
  // Demo Mode candidates ship with a hand-written check.
  if (candidate.literalMeaning && candidate.gap) {
    return { literalMeaning: candidate.literalMeaning, gap: candidate.gap };
  }
  let r: Response;
  try {
    r = await fetch("/api/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    });
  } catch {
    throw new UserFacingError("Couldn't reach the server to check this line.");
  }
  if (r.ok) {
    const data = (await r.json()) as { result: VerifyResult };
    return data.result;
  }
  if (r.status === 429) {
    throw new UserFacingError("Too many checks in a short time. Wait a few minutes and try again.");
  }
  const data = (await r.json().catch(() => ({}))) as { error?: string };
  throw new UserFacingError(
    `Couldn't check this line: ${REASONS[data.error ?? "unknown"] ?? REASONS.unknown}.`,
  );
}
