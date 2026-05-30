# 03 · INPUT & VOICE (Teammate + Antigravity/Gemini)

**You own:** `components/Uploader.tsx`, `components/ReadAloud.tsx`, `components/MicInput.tsx`.
**Do NOT touch** anything else.

## Why you matter
**You own the demo's money moment:** holding up a scary letter and hearing the laptop explain it **out loud in Spanish.** If the voice works flawlessly on the demo laptop, we win the room.

## Your job
1. **`Uploader.tsx`** — photo/upload → base64 data URL → `onImage(dataUrl)`. Make the camera button big and obvious. Test on a real phone (rear camera via `capture="environment"`).
2. **`ReadAloud.tsx`** — speak the text in the right language with `SpeechSynthesis`. **Critical: make sure a Spanish (`es-MX`/`es-ES`) voice actually plays on the demo laptop.** Test it early; some machines need a voice installed.
3. **`MicInput.tsx`** — voice → text via Web Speech API for the "Find my words" flow. Falls back gracefully if unsupported (user types instead).

## The voice risk (read this)
- SpeechSynthesis voices load async — if no voice speaks, call `speechSynthesis.getVoices()` after the `voiceschanged` event and pick an `es-*` voice explicitly.
- **Test in the EXACT browser + laptop we'll demo on.** Chrome is safest. Do this before lunch, not at 5 PM.

## Definition of done
- [ ] Photo upload works on a phone and a laptop
- [ ] English AND Spanish read-aloud both audible on the demo laptop
- [ ] Mic input fills the Express textarea (or degrades cleanly)
- [ ] Pushed to `ui-<yourname>`, PR opened

## Tell your AI
> "Read TEAM.md and AGENTS.md. I own only Uploader.tsx, ReadAloud.tsx, MicInput.tsx. Don't edit any other file or refactor anything. Keep the props unchanged. Work on my branch ui-<name>. Never force-push."
