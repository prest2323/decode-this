# 🔁 SAWYER'S WORK QUEUE — Decode UI + Look & Feel

> ✅ **The app already builds and demos on mock data.** Every component is functional — your job is to make your area *excellent*, not rebuild it. Pull `main` first. Note: the contract changed — `draftReply` is now bilingual `{en, es}` (already wired in ResultCard).

## The loop (never sit idle)
1. Do the first unchecked `[ ]` task below — ONLY in your files: `ResultCard.tsx`, `LanguageToggle.tsx`, `Uploader.tsx`, `ReadAloud.tsx`, `app/globals.css`.
2. Test: `npm run dev`. 3. Mark it `[x]`, `git add` your files, commit, `git push origin ui-sawyer`.
4. Tell Preston "✅ Done: <task>." then start the next. When all `[x]`: "🟢 Queue empty."
> Never edit `lib/*`, `page.tsx`, or `route.ts`. Keep component props unchanged. Never push to `main`.

## The queue (priority order)
- [ ] 1. **🔴 CRITICAL FIRST:** confirm the Spanish (`es-MX`) read-aloud actually speaks in **Chrome on the demo laptop**. This is the money moment. If no Spanish voice, tell Preston immediately.
- [ ] 2. **ResultCard** — make it gorgeous: the urgency pill + countdown deadline should be the bold hero; calm spacing; legible from across a room.
- [ ] 3. **globals.css** — a warm, trustworthy theme (color + a friendly readable font). The baseline is plain light — make it feel human and calm.
- [ ] 4. **Uploader** — downscale the photo before sending: draw to a `<canvas>` capped ~1600px, `toDataURL('image/jpeg', 0.8)`; add `reader.onerror` → friendly message. Fixes slow/blurry phone uploads.
- [ ] 5. **Mobile pass** — phone-first; judges will scan a QR and use it on their own phone.
- [ ] 6. **ReadAloud** — make the 🔊 button big and obvious; confirm start/stop works cleanly.
- [ ] 7. **Accessibility** — a large-text / high-contrast toggle for low-vision users.
- [ ] 8. **Polish** — smooth the result transition; refine the loading shimmer.
