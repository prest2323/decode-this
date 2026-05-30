# 🔁 MK'S WORK QUEUE — Backend: Prompts, Mock, Deploy, QA

> ✅ **The backend works** (Gemini + crash-proof normalization, coherent bilingual mock). Your job: make the real AI output great + deploy + QA. Pull `main` first. The contract changed: `draftReply` is bilingual `{en, es}` — `lib/prompt.ts` already asks for that.

## The loop (never sit idle)
1. Do the first unchecked `[ ]` task — ONLY in your files: `lib/prompt.ts`, `lib/mock.ts` (deploy/QA are config).
2. Test: set a free `GEMINI_API_KEY` in `.env.local` (https://aistudio.google.com/apikey), `npm run dev`.
3. Mark it `[x]`, `git add` your files, commit, `git push origin ui-mk`.
4. Tell Preston "✅ Done: <task>." then start the next. When all `[x]`: "🟢 Queue empty."
> Do NOT edit `lib/types.ts`, `route.ts`, `page.tsx`, or `lib/gemini.ts` — those are Preston's. Never push to `main`.

## The queue (priority order)
- [ ] 1. **Tune the DECODE prompt** (`lib/prompt.ts`) on a real letter photo: plain 5th-grade language, correct deadline, right urgency flag, natural Spanish (not machine-literal), bilingual reply.
- [ ] 2. **Tune the EXPRESS prompt** with messy Spanish input — confirm the output is polished, keeps the user's facts, and respects the `audience`.
- [ ] 3. **Action-box detail** — have decode pull out the *amount owed* and *who to call* inside `meaning`/`action` (this is what beats a plain translator). Keep within the existing fields.
- [ ] 4. **Scam check** — verify a scam-looking doc returns `urgency: "scam"`. Tune if not.
- [ ] 5. **Deploy to Vercel** — `npx vercel`, set `GEMINI_API_KEY` in the dashboard, confirm the live URL works; make a **QR code** and hand it to Aiden.
- [ ] 6. **Add 1–2 mock variants** (a scam, a school form) so the UI can be tested against different urgency states.
- [ ] 7. **Latency check** — time real Gemini calls; pick the fastest good model via `GEMINI_MODEL`.
- [ ] 8. **5 PM QA** — run every demo doc through the LIVE app; log anything off in `STATUS.md`.

> Coming from Preston: a **voice follow-up Q&A** mode (ask a question about the decoded letter, hear the answer). When it lands you'll add its prompt here — Preston will ping you.
