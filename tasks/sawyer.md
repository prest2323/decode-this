# SAWYER (Antigravity + Gemini) — "Decode" UI + Look & Feel

**You own these files ONLY:**
- `components/ResultCard.tsx` — the decoded document, big and legible
- `components/LanguageToggle.tsx` — English / Español switch
- `components/Uploader.tsx` — take photo / upload a document
- `components/ReadAloud.tsx` — 🔊 read it out loud (EN + ES)
- `app/globals.css` — the whole app's colors/fonts/theme

**Do NOT touch** any other file — especially `lib/types.ts`, `app/page.tsx`, or `app/api/`. Those are Preston's.

## Your mission
Make the **"decode a document"** experience beautiful, calm, and readable from across a room. You own how the app *looks* and the all-important **Spanish read-aloud**.

Top priorities:
1. `ResultCard` — clear hierarchy (what it is → what it means → what to do), deadline impossible to miss, urgency badge obvious.
2. `ReadAloud` — **make sure a Spanish voice actually plays in Chrome on the demo laptop.** Test this early.
3. `Uploader` — big obvious camera button, works on a phone.
4. `globals.css` — warm, trustworthy theme.

## Rules
- Keep each component's **props exactly as they are** — redesign the insides freely.
- Build against mock data: just `npm run dev`, the decode screen shows fake data automatically. No API key needed.

## Done when
- [ ] Decoded card is legible from 2m, deadline + urgency pop
- [ ] EN + ES read-aloud both audible in Chrome on the demo laptop
- [ ] Looks good on a phone
- [ ] Pushed to `ui-sawyer`, PR opened for Preston
