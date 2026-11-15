# PROJECT_STATE — Mandarin Message Composer & Meaning Coach

Last updated: 2026-11-15 (Phase 4B: live review status, own wording, community tier; demo rehearsed)

## What it is
A responsive web app for English-speaking beginner Mandarin learners. The user types
what they want to say in English, picks who it's for and how it should sound, and gets
three labelled Chinese candidates (Direct / Natural / Fitted to tone) with characters,
pinyin, English and a nuance note. They can run a meaning check on a candidate, add
lines to a draft and copy the final Chinese text.

## Positioning (decided 2026-11-15)
"AI drafts it. A real Chinese speaker signed off on it. You always know which is which."
Every line carries a provenance label: checked by a native speaker / checked by a
community member / AI-adapted from a checked phrase / AI-generated, not yet checked.
Labels must always be literally true. The long-term vision (two-way language exchange,
streaks, growing bank) lives in the pitch; the hackathon build is the slice below.

## Architecture
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Node 26, npm 11.
  Dependencies beyond the scaffold: `@anthropic-ai/sdk`, `zod`.
- Single page: `src/app/page.tsx` renders `src/components/Composer.tsx` (all state).
- `src/lib/types.ts` — shared shapes (ComposeRequest/Result, Candidate, Provenance, VerifyResult).
- `src/lib/schemas.ts` — Zod schemas for request validation and model output.
- `src/lib/demo-data.ts` — hand-written Demo Mode examples + `matchDemo()`.
- `src/data/verified-phrases.json` + `src/lib/phrase-bank.ts` — the verified phrase bank
  (tone, context, region, verification status/level/note). Only `status: "verified"`
  entries are ever matched; `provenanceFor()` decides the label for each candidate.
- `src/lib/server/ai.ts` — all provider calls (server only). `generateCandidates()` uses
  structured output; `verifyCandidate()` is a two-step blind check: step 1 sees only the
  Chinese (literal meaning + register), step 2 compares with the intent (gap).
- `src/lib/server/limits.ts` — in-memory cache (300 entries, 24h) and per-IP limit
  (30 requests / 10 min). Resets when the server process restarts.
- Routes: `src/app/api/compose/route.ts`, `src/app/api/verify/route.ts`. Both return 503
  `no_provider` when `ANTHROPIC_API_KEY` is unset; the browser then falls back to Demo
  Mode with a visible note naming the reason.
- `src/lib/compose.ts` — browser side: calls the routes, falls back to Demo Mode,
  surfaces rate-limit/validation errors to the user instead of hiding them.
- Components: `IntentForm` (intent, chips, optional context), `CandidateCard` (+ skeleton,
  `ProvenanceBadge`, "Request a human check"), `MeaningCheck` (loading/error/ready,
  register meter), `DraftTray`, `StreakPill`, `ReviewDesk` (page `/review`).
- Human review loop (Phase 3):
  - `src/lib/server/bank-store.ts` reads/writes `verified-phrases.json` and
    `review-queue.json` at request time (file-backed; needs a writable disk).
  - `POST /api/review/request` queues a live candidate + the user's intent (user taps).
  - `GET /api/review/queue` and `POST /api/review/decide` need header `x-reviewer-code`
    matching `REVIEWER_CODE` (level "native") or `COMMUNITY_CODE` (level "community").
  - decide: keep -> bank; fix -> AI screen (`screenEdit`: Simplified? appropriate? same
    meaning?) then bank; reject -> dropped. Approvals clear the compose cache.
  - Compose: if the model paraphrases a matched approved line, the server restores the
    approved wording verbatim as the "natural" candidate (`verifiedMatch` in response).
- Pinyin: `src/lib/server/pinyin.ts` (pinyin-pro, per-syllable with tone marks, ASCII
  punctuation, sentence capitals) is used for every live candidate and bank entry.
  `scripts/lib/pinyin.mjs` is the Node copy used by the scripts.
- Streak: `src/lib/streak.ts`, per device in localStorage, counts days with a copy or a
  review request; shown as a pill in the header.
- Design tokens in `src/app/globals.css` (`@theme`). Chinese uses the system CJK stack.
- No database, no auth, no analytics. Draft kept in memory only. Server logs failure
  types only, never message content.
- Env: `.env.local` (ignored by Git) holds `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`
  (default `claude-opus-5-5`). `.env.example` documents them.

## Completed
- [x] Phase 0: evaluation, competitor research, provider comparison (in chat, 2026-11-15).
- [x] Phase 1: project scaffold, design tokens, full interface on Demo Mode data,
      loading / empty / error states, responsive layout, type-check and lint clean,
      manual browser test of the whole flow (compose → check meaning → add → copy).

- [x] Phase 2A: compose + verify routes, structured output, blind two-step meaning
      check, cache, rate limit, Demo Mode fallback with reasons, provenance labels,
      phrase bank with matching, optional context field, register meter. Tested only
      on the no-key path (no API key available yet).

- [x] Phase 2B: live generation and live meaning check tested with a real key.
      Compose ~10 s at `effort: low` (17 s at medium, no visible quality gain), meaning
      check ~8 s (two sequential calls). Review CSVs imported: 40 Chinese lines approved
      by Yuwa He (native speaker), 15 Spanish lines approved by Juan Vasquez (Colombia).

- [x] Phase 3 core: reviewer desk with keep/fix/reject + tone/region/note, AI screen
      on fixes, request-a-human-check button, per-device streak, library pinyin,
      verbatim restore of approved lines. Full loop tested from the browser:
      request -> approve on /review -> recompose shows the green badge.

- [x] Phase 4A: `npm run build` passes (Google Fonts dependency removed; system fonts
      only, so the build and demo work on restricted Wi-Fi). Hardening from Grok's
      review: keep AND fix are AI-screened; two explicit confirmations before approving;
      the official reviewer's name is bound to the code (`REVIEWER_NAME`), not typed;
      approved lines are reused only for the same relationship with >= 2 keyword hits;
      screening prompt treats all texts as data. Cached requests no longer count toward
      the rate limit (default 60 / 10 min, `RATE_MAX`). Four unreviewed seed lines
      removed. `scripts/prewarm.mjs` and `DEMO.md` added. Desk checked at phone width.

## Outstanding
- Phase 4B: full rehearsal with the reviewer on a phone over local Wi-Fi; decide on a
  public deploy (needs a writable host or a small hosted store for the bank; not
  required for a laptop demo); slides for the vision; final bug pass.
- Roadmap (not for the hackathon): individual revocable reviewer links instead of a
  shared code; highlight numbers/dates/negation changes for the reviewer; second
  language direction; hosted store.
- Bank matching is keyword-based and crude; watch for false matches on short intents.
- Spanish bank (`verified-phrases-es.json`) is data only; no UI reads it yet.

## Important decisions
- AI provider: Anthropic API, default model `claude-opus-5-5`, model name in an env var
  so Sonnet 5.5 is a one-line switch. Budget cap: $10 total, prepaid, no auto-reload.
- Simplified Chinese only, mainland everyday texting style.
- Generation happens only on button press (never per keystroke). Input capped at 300 chars.
- Demo Mode is always labelled; mock output is never presented as live AI.
- Draft is not persisted (privacy + simpler code).
- Provider refusals are treated as an ordinary failure (Demo Mode fallback) rather than
  wiring the server-side fallback option; the content here is everyday messaging.
- The meaning check runs on demand per candidate (click), not for all three up front,
  to save tokens and latency. Step 1 is blind by design; keep it that way.
- One language direction (en -> zh-Hans) is built. `sourceLanguage`/`targetLanguage`
  fields exist so Spanish can be added as configuration later.

## How to run
```bash
npm install
npm run dev
```
Open http://localhost:3000. Checks: `npx tsc --noEmit`, `npm run lint`, `npm run build`.
For the demo use `npm run build` then `npm start`, then `node scripts/prewarm.mjs`
(see DEMO.md).

Review workflow (bulk): reviewers fill `decision` (keep/fix/reject), `*_fixed`,
`reviewer_note` and `reviewer_name` in `review/phrases-to-review.csv` (Chinese) or
`review/spanish-to-review.csv` (Spanish), then run `npm run import:reviewed`.
Only keep/fix rows become `verified`; everything else stays pending and never shows a badge.
`node scripts/fill-pinyin.mjs` regenerates all bank pinyin.

Review workflow (live): open `/review`, enter the reviewer code from `.env.local`
(`REVIEWER_CODE`) and your name, load the queue, decide per line. Reachable from a phone
on the same Wi-Fi at the "Network" URL that `npm run dev` prints.

Testing note: do not round-trip Chinese through PowerShell's Invoke-RestMethod (it
decodes JSON as Latin-1 and garbles it). Use the browser or Node for API tests.

On this PC, Node and Git are installed but a freshly opened shell may need a restart to
see them. Claude Code's launch config (`.claude/launch.json`) uses the full npm path.

## Known problems
- Demo Mode only knows four intents; other inputs return the closest example with a
  visible note saying so.
- Pinyin (demo data and live) is model/hand-written and unverified; Phase 3 generates it.
- Compose takes ~10 s; the loading state covers it but it is slow for a live demo.
  Options if needed: Sonnet 5.5 via `ANTHROPIC_MODEL`, or pre-warming the cache with
  the demo script's intents before going on stage.
- The four original seed bank entries are still `pending` (written by the developers).
- Compose latency varies 9-21 s with the provider's load. For the stage demo, pre-warm
  the cache by running the demo intents once before presenting.
- The bank files change at runtime (approvals write to `src/data/*.json`), so `git status`
  will show them modified after a demo session. Commit or discard deliberately.
- Next.js 16: do not add `export const runtime` to route files (conflicts with
  `cacheComponents`).

## Phase 4B additions (2026-11-15)
- Live review status: `GET /api/review/status?ids=` reads `review-queue.json` and
  `review-decisions.json` (written by decide). The composer polls every 4 s while a
  requested line is waiting and updates the card in place: "Approved by…", "Approved
  with a change" (card text, pinyin and badge switch to the reviewer's wording), or
  "Rejected by the reviewer".
- Own wording: under live results, "Know a better way to say it?" lets the user submit
  their own Chinese line (`source: "user"`, provenance `user-submitted`). It appears as a
  fourth card and goes through the same queue, screen and badges.
- Three trust tiers are visible on cards: "Checked by a native speaker" (official code,
  name bound to `REVIEWER_NAME`), "Checked by a community member" (`COMMUNITY_CODE`,
  name typed), and the AI / user "not yet checked" labels. A count line shows
  "N of M checked by a person".
- `.env.local` now has `COMMUNITY_CODE=friends-2026` for community reviewers.
- Rehearsal done on laptop + phone over local Wi-Fi; production build passes.
- Test data policy: lines approved during Claude's tests were removed from the bank so
  no badge carries a reviewer's name without that reviewer having approved it.
