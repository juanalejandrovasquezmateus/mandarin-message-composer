# Demo runbook

Technical steps for the stage demo. The spoken script lives with the presenters.

## The day before
1. Charge the laptop and the reviewer's phone. Both must be on the **same Wi-Fi**.
2. Confirm `.env.local` has `ANTHROPIC_API_KEY`, `REVIEWER_CODE`, `REVIEWER_NAME`.
3. Check credit remains at console.anthropic.com (a full rehearsal costs under $0.20).
4. Demo sentence: "I want to thank my friend for helping me with homework, but not sound too formal", Friend + Casual. It returns three unchecked lines, so the "request a human check" moment works. It is in the pre-warm list, so the result is instant.

## 15 minutes before
Open a terminal in the project folder and run, one after the other:

```bash
npm run build
```

```bash
npm start
```

Note the two addresses it prints: `Local` (laptop) and `Network` (phone). Keep this
terminal open for the whole demo. Then, in a second terminal:

```bash
node scripts/prewarm.mjs
```

This fills the cache so every planned click is instant. Re-run it if you restart the server.

On the reviewer's phone open `http://<Network address>/review`, enter the reviewer code,
tap **Load queue**. Leave that page open.

## The flow on stage
1. Laptop: type the demo intent, pick who it's for and the tone, **Find ways to say it**.
2. Point at the three cards and the labels. Open **Check meaning** on one.
3. On an AI-generated card tap **Request a human check**.
4. Phone: tap **Load queue**, tick both confirmations, **Keep as is**. Wait for the green
   toast (the AI screen takes about 5 seconds).
5. Laptop: open a new tab on the same address, enter the same intent and settings. The
   approved line now shows **Checked by a native speaker**.
6. **Add to draft**, **Copy message**, show the streak pill.

## If something goes wrong
- **No internet / AI service down:** the app falls back to Demo Mode by itself and says so
  on screen. The four example chips still work. Say "this is the prepared fallback" and
  continue with the labels story.
- **Phone cannot reach the laptop:** do step 4 on the laptop in a second tab at `/review`.
- **A request says "Already checked":** that line was approved in rehearsal. Pick another
  AI-generated card, or reject the line from the desk first.
- **Slow first response:** you forgot to pre-warm. Keep talking; it arrives in 10-20 s.

## After the demo
`git status` will show `src/data/*.json` changed by approvals. Commit them if you want to
keep the new lines, or run `git checkout -- src/data` to discard.

## Live approval (added)
The user's page updates by itself within about 4 seconds of the reviewer's decision:
no refresh and no second tab needed. After step 4, just point at the card: the label
flips to "Approved by Yuwa He" (or "Approved with a change" showing her wording). Step 5
is now optional. Community reviewers use code `friends-2026`; their approvals show as
"Checked by a community member".

Reminder: `npm run build` then `npm start` again before the demo, since the code changed
after the rehearsal.
