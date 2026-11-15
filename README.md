# Mandarin Message Composer & Meaning Coach

**AI drafts it. A real native speaker signs off on it. You always know which is which.**

A web app for English or Spanish speakers who text friends, classmates, host families or
teachers in Chinese (and, with one switch, for learners of Spanish). You type what you want
to say, choose who it's for and the tone, and get three natural ways to say it, a meaning
check that reads the message without seeing your intent, and a label on every line telling
you whether a real person has approved it. Native speakers can check lines live from their
phone and contribute their own wording, which then appears for every later learner.

Built in one day at ONHacks 2026 (Toronto) by two Grade 12 students with Claude Code as
the engineer, ChatGPT and Grok as research and review assistants, and native-speaking
reviewers Yuwa He (Chinese) and Juan Vasquez (Spanish).

## Why not just ask ChatGPT?

A chatbot gives you one answer and asks you to trust it. This product does four things a
chat box does not:

1. **A choice, not an answer.** Three labelled versions (Direct, Natural, Fitted to tone)
   with pinyin, meaning and a note on how each sounds to a native speaker.
2. **An independent check.** A second model call reads only the Chinese (or Spanish) and
   reports what it literally says and how formal it is; a third compares that with your
   intent and names any gap. The check never sees your original words, so it cannot
   rubber-stamp them.
3. **Human-verified trust tiers.** Every line carries one of: *Checked by a native
   speaker* (official checker), *Checked by a community member*, *AI-adapted from a
   checked line*, *AI-generated, not yet checked*, or *Written by a user, not yet checked*.
   The labels are enforced by the server and are literally true.
4. **A bank that grows from people.** Users request a human check on any line, or write
   their own wording; reviewers approve from a phone; the user's page updates live within
   seconds, and the approved line is reused for every future learner in that situation.

## What it does (feature list)

- English or Spanish intent → three candidates in Chinese or Spanish, with relationship
  (friend / classmate / family / teacher) and tone (casual / friendly / polite / appreciative)
  and optional free-text context.
- Blind two-step meaning check with a casual-to-formal register meter and a gap note.
- Pinyin generated deterministically from characters (never by the model).
- Draft tray: assemble lines, copy the final message.
- "Request a human check" on any unverified line; live status on the card (approved,
  approved with a change, rejected).
- "Know a better way to say it?": submit your own wording through the same review.
- "Give back": native speakers answer common situations in their language; approved
  lines enter the bank for learners.
- Reviewer desk (`/review`): shared code, keep / fix / reject with tone, region and a
  note, two explicit confirmations, AI screening of every approval (script, appropriateness,
  same meaning). Official checker names are bound to configuration, not typed.
- Demo Mode with prepared examples, clearly labelled, used automatically if the AI
  service is unavailable.
- Per-device daily streak shown as the Shanghai Tower lighting up by tier.
- Shanghai-at-night interface: animated Lujiazui skyline, neon accents, glass cards,
  phone-friendly layout, reduced-motion aware.

## How it's built

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript | One project for UI and server routes; the API key never reaches the browser |
| Styling | Tailwind CSS 4 with design tokens in `globals.css` | Consistent palette and spacing; system fonts only, so builds work offline |
| AI | Anthropic Claude API (`claude-opus-5-5`, effort `low`) via `@anthropic-ai/sdk` | Best nuance explanations; structured JSON output validated with Zod |
| Structured output | `client.messages.parse` + `zodOutputFormat` | The model's answer must match the schema or the request fails loudly |
| Pinyin | `pinyin-pro` | Reliable tone marks; models make tone mistakes |
| Data | JSON files under `src/data` (phrase banks per language, review queue, decision log) | No database to run; fine for a laptop demo or any host with a disk |
| Caching / limits | In-memory cache (24 h) and per-visitor rate limit | Repeat demo clicks are instant and free; abuse is bounded |

### Request flow

```
intent + relationship + tone (+ context, language)
   → POST /api/compose
       → bank match (same relationship, ≥3 keyword hits)
       → Claude: three candidates (structured output)
       → if the model paraphrased an approved line, restore it verbatim (similarity-gated)
       → provenance label per candidate, pinyin from library, cache
   → user taps "Check meaning"
   → POST /api/verify
       → call 1 sees ONLY the line: literal meaning + register
       → call 2 compares with the intent: gap or "none"
   → user taps "Request a human check" / submits own wording
   → POST /api/review/request  → review-queue.json
   → reviewer (/review, x-reviewer-code header)
       GET /api/review/queue, POST /api/review/decide
       → AI screen → bank file → decision log → compose cache cleared
   → user's page polls GET /api/review/status every 4 s and updates the card
```

### Prompt techniques

- Three deliberately different registers requested by name, with a rule against inventing
  commitments the user did not express.
- Verified-line injection: when the bank has an approved line for the situation, the model
  is told to use it verbatim if it fits, flag an adaptation otherwise. The server enforces
  the final label, never the model.
- Blind verification: the literal-translation call receives nothing but the line.
- Screening prompt treats all user and reviewer text as data, with explicit instructions to
  ignore embedded instructions; output is structured booleans plus a one-sentence reason.

### Safety and honesty rules baked in

- No mock output is ever shown as live AI; Demo Mode is always labelled.
- Nothing a user types is stored unless they explicitly send a line for review.
- Server logs failure types only, never message content.
- Lines approved during development testing were removed; a badge only carries a
  reviewer's name if that reviewer approved the line.

## Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY, REVIEWER_CODE, REVIEWER_NAME(_ES)
npm run dev                  # http://localhost:3000
```

Production: `npm run build` then `npm start`; `node scripts/prewarm.mjs` warms the cache.
Reviewers open `/review` from any device on the same network. See `DEMO.md` for the stage
runbook and `PROJECT_STATE.md` for architecture, decisions and open items.

## Status and roadmap

Working end to end for Chinese and Spanish on a laptop with a native reviewer on a phone.
Next: individual revocable reviewer links instead of a shared code, a hosted store so the
bank survives a serverless deploy, highlighting numbers and negation changes for reviewers,
and more languages, which are now configuration rather than new code.
