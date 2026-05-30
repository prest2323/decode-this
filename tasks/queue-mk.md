# 🔁 MK'S WORK QUEUE — Backend #2: Prompts, Mock, Deploy, QA

## How this works (the loop — never sit idle)
1. Find the **first unchecked `[ ]` task** below. Do ONLY that one.
2. Touch ONLY your files: `lib/prompt.ts`, `lib/mock.ts` (deploy/QA tasks are config, not Preston's code).
3. Test it: `npm run dev` (set a free `GEMINI_API_KEY` in `.env.local` to test real output — get one at https://aistudio.google.com/apikey).
4. When it works: change `[ ]` to `[x]` here, then `git add` your files, commit, `git push origin ui-mk`.
5. Tell Preston in Discord: **"✅ Done: <task>. Pulling next."**
6. Repeat from step 1. When EVERY box is `[x]`, message Preston: **"🟢 Queue empty — ready for more."** and wait.

> Rule: do NOT edit `lib/types.ts`, `app/api/decode/route.ts`, or `app/page.tsx` — those are Preston's. Coordinate in chat. Never push to `main`.

## The queue (in priority order)
- [ ] 1. **Tune DECODE prompt** (`lib/prompt.ts`) — test on a real document photo; make sure EN+ES are natural, the deadline is correct, and the urgency flag is right.
- [ ] 2. **Tune EXPRESS prompt** — feed it messy Spanish input; confirm the output email/letter is polished and keeps the user's facts (invents nothing).
- [ ] 3. **mock.ts realism** — make `MOCK_DECODE` / `MOCK_EXPRESS` look like a real winning result (the UI team builds against this).
- [ ] 4. **Deploy to Vercel** — `npx vercel`, set `GEMINI_API_KEY` in the Vercel dashboard, confirm the live URL works.
- [ ] 5. **QR code** — generate a QR for the live URL; hand it to Aiden for the judge one-pager.
- [ ] 6. **Scam detection check** — verify a scam-looking doc returns `urgency: "scam"`. Tune the prompt if not.
- [ ] 7. **Add 2 extra mock variants** (e.g., a school form, a scam) so the UI can be tested against different urgency states.
- [ ] 8. **Latency check** — time real Gemini calls; if slow, try `GEMINI_MODEL=gemini-2.5-flash` vs alternatives and pick the fastest good one.
- [ ] 9. **Error handling** — confirm a bad/blurry image returns a friendly error, not a crash.
- [ ] 10. **5 PM full QA** — run all 4 of Aiden's demo docs through the LIVE deployed app; log anything off in `STATUS.md`.
