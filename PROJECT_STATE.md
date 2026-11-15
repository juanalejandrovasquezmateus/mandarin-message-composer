# PROJECT_STATE — Mandarin Message Composer & Meaning Coach

Last updated: 2026-11-15 (end of Phase 1)

## What it is
A responsive web app for English-speaking beginner Mandarin learners. The user types
what they want to say in English, picks who it's for and how it should sound, and gets
three labelled Chinese candidates (Direct / Natural / Fitted to tone) with characters,
pinyin, English and a nuance note. They can run a meaning check on a candidate, add
lines to a draft and copy the final Chinese text.

## Architecture
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4. Node 26, npm 11.
- Single page: `src/app/page.tsx` renders `src/components/Composer.tsx` (all state).
- `src/lib/types.ts` — shared data shapes (ComposeRequest, ComposeResult, Candidate).
- `src/lib/demo-data.ts` — hand-written Demo Mode examples + `matchDemo()`.
- `src/lib/compose.ts` — `composeMessage()`; Phase 1 returns Demo Mode data only.
  Phase 2 will call a server route (`src/app/api/compose/route.ts`) that holds the API key.
- Components: `IntentForm`, `CandidateCard` (+ skeleton), `MeaningCheck`, `DraftTray`.
- Design tokens live in `src/app/globals.css` (`@theme`): paper background, ink text,
  one cinnabar accent. Chinese text uses the system CJK font stack via `lang="zh-Hans"`.
- No database, no auth, no analytics. The draft is kept in memory only (nothing stored).

## Completed
- [x] Phase 0: evaluation, competitor research, provider comparison (in chat, 2026-11-15).
- [x] Phase 1: project scaffold, design tokens, full interface on Demo Mode data,
      loading / empty / error states, responsive layout, type-check and lint clean,
      manual browser test of the whole flow (compose → check meaning → add → copy).

## Outstanding
- Phase 2: `/api/compose` route with the Anthropic SDK, structured JSON output,
  blind back-translation meaning check, server cache, input limits, rate limit,
  automatic fallback to Demo Mode on failure, "Live AI" badge.
- Phase 3: pinyin from `pinyin-pro` instead of the model, vocabulary polish,
  native-speaker validation of at least 10 intents, visual polish.
- Phase 4: scenario testing, Vercel deploy, demo script, bug fixes.
- Replace hand-written demo data with the ChatGPT-generated + Grok-reviewed set once
  it is saved as `demo-data.json` and checked.

## Important decisions
- AI provider: Anthropic API, default model `claude-opus-5-5`, model name in an env var
  so Sonnet 5.5 is a one-line switch. Budget cap: $10 total, prepaid, no auto-reload.
- Simplified Chinese only, mainland everyday texting style.
- Generation happens only on button press (never per keystroke). Input capped at 300 chars.
- Demo Mode is always labelled; mock output is never presented as live AI.
- Draft is not persisted (privacy + simpler code).

## How to run
```bash
npm install
npm run dev
```
Open http://localhost:3000. Checks: `npx tsc --noEmit` and `npm run lint`.

On this PC, Node and Git are installed but a freshly opened shell may need a restart to
see them. Claude Code's launch config (`.claude/launch.json`) uses the full npm path.

## Known problems
- Demo Mode only knows four intents; other inputs return the closest example with a
  visible note saying so.
- Pinyin in demo data is hand-written and unverified by a native speaker.
- No live AI yet; the "Live AI" badge exists in code but is never shown in Phase 1.
