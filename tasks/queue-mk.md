# 🔁 MK'S WORK QUEUE — Backend Lead #2 (heavy track)

> ✅ The backend works (Gemini + crash-proof normalization, coherent bilingual mock). You're on a capable plan, so this queue goes DEEP. Pull `main` first. Contract: `draftReply` is bilingual `{en, es}`.

## You own
`lib/prompt.ts`, `lib/mock.ts`, `scripts/` (new — your eval harness), Vercel deploy, QA.
**Do NOT edit** `lib/types.ts`, `lib/gemini.ts`, `app/api/decode/route.ts`, `app/page.tsx` (Preston's) — coordinate in chat.

## The loop (never sit idle)
Do the first unchecked `[ ]` task → test (`GEMINI_API_KEY` in `.env.local`, `npm run dev`) → mark `[x]` → `git add` your files → commit → `git push origin ui-mk` → tell Preston "✅ Done: X" → next. Queue empty → "🟢 Queue empty." Never push to `main`, never force-push.

## The queue (priority order)
- [ ] 1. **Deep DECODE prompt tuning** (`lib/prompt.ts`) — make it robust across doc classes: Medi-Cal/benefits, DMV, court summons, utility shut-off, school forms, immigration notices. Each must yield correct `urgency`, an extracted `deadline`, and plain **5th-grade** language in natural EN + ES. Add a few-shot example or two in the system prompt.
- [ ] 2. **Action extraction** — decode must reliably surface the **amount owed** and **who to call (phone #)** inside `action`/`meaning`. This is what beats a plain translator. Verify on real letters.
- [ ] 3. **Scam taxonomy** — encode Kern County scam patterns (fake ICE/immigration notices, gift-card/wire demands, "pay to avoid arrest", fake utility shut-off) → `urgency: "scam"` with a clear, non-alarmist warning. Test against 3–4 crafted scam samples.
- [ ] 4. **EXPRESS prompt depth** — audience-aware tone (teacher / landlord / court / clinic), keep the user's facts (invent nothing), pick the right channel/format, bilingual. Test with messy Spanish input.
- [ ] 5. **Build an eval harness** — `scripts/eval.mjs`: POST a set of sample cases to `http://localhost:3000/api/decode` and print a table of `{case, urgency, deadline, bilingual?, latency_ms}`. This lets us regression-check every prompt change. (Node `fetch`, no deps.)
- [ ] 6. **Mock library** — expand `lib/mock.ts` to 4–5 realistic variants spanning every urgency state (urgent / normal / ignore / scam) + a Spanish-first one, so the UI can be tested against each. Keep one exported as the hero (`MOCK_DECODE`).
- [ ] 7. **Multi-language scaffolding** — add a path in the prompt for a third language (Tagalog or Punjabi); mark output "wired, pending native QA." Don't block the demo on it.
- [ ] 8. **Deploy to Vercel** — `npx vercel`, set `GEMINI_API_KEY` in the dashboard, confirm the live URL; generate a **QR code** for judges; hand the URL to Aiden.
- [ ] 9. **Model benchmark** — run the eval harness against `gemini-2.5-flash` vs `-flash-lite` vs `-pro`; pick the fastest that stays accurate; set the default via `GEMINI_MODEL`. Report numbers in `STATUS.md`.
- [ ] 10. **Reliability pass** — confirm a blurry/garbage image and a malformed model reply both fail gracefully (friendly message, no crash). If you find a normalization gap, flag Preston (it's in `gemini.ts`).
- [ ] 11. **5 PM live QA** — run every demo doc through the LIVE deployed app; log anything off in `STATUS.md`.

> **Coming next from Preston:** a **voice follow-up Q&A** mode (ask a question about the decoded letter, hear the answer). When the contract + route land, you'll own the `FOLLOWUP` prompt in `lib/prompt.ts` — Preston will ping you with the shape.
