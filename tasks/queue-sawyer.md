# 🔁 SAWYER'S WORK QUEUE — Decode UI + Look & Feel

## How this works (the loop — never sit idle)
1. Find the **first unchecked `[ ]` task** below. Do ONLY that one.
2. Touch ONLY your files: `ResultCard.tsx`, `LanguageToggle.tsx`, `Uploader.tsx`, `ReadAloud.tsx`, `app/globals.css`.
3. Test it: `npm run dev` → http://localhost:3000 (runs on mock data).
4. When it works: change `[ ]` to `[x]` here, then `git add` your files, commit, `git push origin ui-sawyer`.
5. Tell Preston in Discord: **"✅ Done: <task>. Pulling next."**
6. Repeat from step 1. When EVERY box is `[x]`, message Preston: **"🟢 Queue empty — ready for more."** and wait.

> Rule: keep component props unchanged. Never edit `lib/*`, `page.tsx`, or `route.ts`. Never push to `main`.

## The queue (in priority order)
- [ ] 1. **ResultCard** — clear hierarchy: title → meaning → action. Big, readable type.
- [ ] 2. **ResultCard** — make the urgency badge unmissable (urgent=red, scam=red 🚩, normal=neutral, ignore=gray) and the deadline bold + obvious.
- [ ] 3. **LanguageToggle** — instant EN/Español switch, clearly shows the active language.
- [ ] 4. **globals.css** — set a warm, trustworthy theme (colors + a friendly readable font). Apply app-wide.
- [ ] 5. **Uploader** — big obvious "📷 Take a photo / Upload" button; works with rear camera on a phone (`capture="environment"`); converts to base64 data URL.
- [ ] 6. **ReadAloud** — 🔊 button that speaks the text. **Critical: confirm a Spanish (`es-*`) voice actually plays in Chrome on the demo laptop.** Test early.
- [ ] 7. **ResultCard** — add a clean loading state (skeleton/spinner) and a friendly error state.
- [ ] 8. **Mobile pass** — everything looks great on a phone screen (judges may scan a QR).
- [ ] 9. **Accessibility** — a large-text / high-contrast toggle for low-vision users.
- [ ] 10. **Polish** — subtle transitions so results appear smoothly, not jarringly.
