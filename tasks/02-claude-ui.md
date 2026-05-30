# 02 · CORE UI (Teammate + Claude Code) — the "Decode" side

**You own:** `components/ResultCard.tsx`, `components/LanguageToggle.tsx`, `app/globals.css`.
**Do NOT touch** anything else (especially `lib/types.ts` or `app/page.tsx`).

## Why you matter
**Clarity is a judging criterion, and it lives in your files.** When a judge looks at the decoded letter, it must be readable from across the room and feel calm, not cluttered. You win the "clarity" points.

## Your job
1. Make `ResultCard.tsx` beautiful and BIG: clear hierarchy (what it is → what it means → what to do), the urgency badge obvious, the deadline impossible to miss, the draft-reply easy to read.
2. Make `LanguageToggle.tsx` feel instant and obvious (English / Español).
3. Use `app/globals.css` for any shared styling (fonts, colors). Pick a warm, trustworthy look.

## Rules
- **Keep the props exactly as they are** (`{ result, lang }` and `{ lang, onChange }`). Redesign the insides however you want.
- Build against mock data — just run `npm run dev`, decode shows `MOCK_DECODE` automatically.

## Definition of done
- [ ] ResultCard is legible from 2 meters away; urgency + deadline pop
- [ ] Language toggle switches all text instantly
- [ ] Looks polished on a phone screen (judges may scan a QR)
- [ ] Pushed to `ui-<yourname>`, PR opened for the Lead

## Tell your AI
> "Read TEAM.md. I own only ResultCard.tsx, LanguageToggle.tsx, and globals.css. Don't edit any other file. Keep the component props unchanged. Work on my branch ui-<name>."
