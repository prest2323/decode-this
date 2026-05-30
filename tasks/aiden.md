# AIDEN (Antigravity + Gemini) — "Express" UI + Demo + Pitch

**You own these files ONLY:**
- `components/ExpressInput.tsx` — where you type/speak a messy thought
- `components/ExpressResult.tsx` — the polished email/letter that comes back
- `components/MicInput.tsx` — 🎤 voice-to-text for the express box
- `demo/` — the real sample documents we show on stage
- `PITCH.md` — the 90-second pitch script

**Do NOT touch** any other file — especially `lib/types.ts`, `app/page.tsx`, or `app/api/`. Those are Preston + MK's.

## Your mission
Build the **"find my words"** side (you → world) AND own the demo. You hold two judging points: **usefulness** (real demo docs) and **learning** (the lessons slide).

Priorities:
1. `ExpressInput` / `ExpressResult` — inviting input ("say it however it comes out"), result with a one-tap **Copy** button.
2. `MicInput` — speak → fills the box (Web Speech API); if unsupported, user just types.
3. **Collect 4 real demo docs** in `demo/` (benefits letter, school form, bill, a scam) — **redact personal info**. Phone photos are perfect.
4. `PITCH.md` — fill the 90-sec script + 3-bullet "what we learned".

## Rules
- Keep each component's **props exactly as they are** — redesign insides freely.
- Build against mock data: `npm run dev`, the express screen shows fake output. No API key needed.

## Done when
- [ ] Express flow polished, Copy button works
- [ ] 4 real docs in `demo/`, personal info redacted
- [ ] `PITCH.md` filled + rehearsed out loud 3×
- [ ] Pushed to `ui-aiden`, PR opened for Preston
