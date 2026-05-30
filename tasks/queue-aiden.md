# 🔁 AIDEN'S WORK QUEUE — Express UI + Demo + Pitch

> ✅ **The app already builds and demos on mock data.** Your components work — make them excellent and own the demo. Pull `main` first.

## The loop (never sit idle)
1. Do the first unchecked `[ ]` task — ONLY in your files: `ExpressInput.tsx`, `ExpressResult.tsx`, `MicInput.tsx`, `demo/`, `public/` (demo image), `PITCH.md`.
2. Test: `npm run dev`. 3. Mark it `[x]`, `git add` your files, commit, `git push origin ui-aiden`.
4. Tell Preston "✅ Done: <task>." then start the next. When all `[x]`: "🟢 Queue empty."
> Never edit `lib/*`, `page.tsx`, or `route.ts`. Keep component props unchanged. Never push to `main`.

## The queue (priority order)
- [ ] 1. **🔴 THE HERO DOC:** create a realistic, **redacted** Kern County Medi-Cal renewal letter image and save it as `public/demo-medical-letter.jpg` — this is what we upload on stage so the demo never stalls. Match the mock (coverage ends Jun 12, renew by Jun 5).
- [ ] 2. **PITCH.md** — write the full 90-second script using the beat-by-beat plan in `docs/DESIGN-LOCKED.md`. Make it muscle-memory tight.
- [ ] 3. **"What we learned"** — 3 honest bullets (vision-model limits, bilingual UX, accessibility). It's a judging criterion.
- [ ] 4. **MicInput** — replace the `alert()` with an inline message; surface a denied-mic error ("Couldn't hear you — try typing"). Optional: live partial transcript.
- [ ] 5. **ExpressInput / ExpressResult polish** — make the input inviting and the result beautiful (chips, Copy, Read-aloud already work).
- [ ] 6. **One scam demo doc** — a redacted scam-looking letter in `demo/` to show the 🚩 flag (optional second demo).
- [ ] 7. **Judge one-pager** — a simple printable card: what Decode This does + the QR (get the deploy URL from MK).
- [ ] 8. **Mobile pass** on the express flow.
