import { matchDemo } from "./demo-data";
import type { ComposeRequest, ComposeResult, ResultSource } from "./types";

export interface ComposeResponse {
  result: ComposeResult;
  source: ResultSource;
  /** Shown to the user when the result needs a caveat (e.g. demo mismatch). */
  note?: string;
}

/**
 * Phase 1: Demo Mode only. Returns a prepared example after a short delay so
 * the loading state is visible.
 * Phase 2 will call the server route for live generation and fall back to
 * this function when the provider is unavailable.
 */
export async function composeMessage(
  req: ComposeRequest,
): Promise<ComposeResponse> {
  await new Promise((r) => setTimeout(r, 900));
  const { result, matched } = matchDemo(req);
  return {
    result,
    source: "demo",
    note: matched
      ? undefined
      : "Demo Mode only has prepared examples. This is the closest one, not a response to your exact words.",
  };
}
