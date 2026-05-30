# 🔁 AIDEN'S WORK QUEUE — Express UI + Demo + Pitch

## How this works (the loop — never sit idle)
1. Find the **first unchecked `[ ]` task** below. Do ONLY that one.
2. Touch ONLY your files: `ExpressInput.tsx`, `ExpressResult.tsx`, `MicInput.tsx`, `demo/`, `PITCH.md`.
3. Test it: `npm run dev` → http://localhost:3000 (runs on mock data).
4. When it works: change `[ ]` to `[x]` here, then `git add` your files, commit, `git push origin ui-aiden`.
5. Tell Preston in Discord: **"✅ Done: <task>. Pulling next."**
6. Repeat from step 1. When EVERY box is `[x]`, message Preston: **"🟢 Queue empty — ready for more."** and wait.

> Rule: keep component props unchanged. Never edit `lib/*`, `page.tsx`, or `route.ts`. Never push to `main`.

## The queue (in priority order)
- [ ] 1. **ExpressInput** — an inviting textarea ("Say it however it comes out — any language"). Big, friendly.
- [ ] 2. **ExpressResult** — show the polished text clearly with a one-tap **Copy** button (and a little "copied!" confirmation).
- [ ] 3. **MicInput** — 🎤 button: speak → text fills the input (Web Speech API). If unsupported, hide it gracefully so the user just types.
- [ ] 4. **Demo docs** — collect **4 real documents** into `demo/`: a benefits/Medi-Cal letter (with a deadline), a school form, a bill, and one that looks like a scam. **Redact all personal info.** Phone photos are fine.
- [ ] 5. **PITCH.md** — write the full 90-second script (use the beats already in the file). Make it punchy.
- [ ] 6. **PITCH.md** — write the 3-bullet "What we learned" (judging criterion).
- [ ] 7. **ExpressInput** — add a quick audience picker (Teacher / Landlord / Clinic / Other) that fills the `audience` field.
- [ ] 8. **States** — clean loading + error states for the express flow.
- [ ] 9. **Mobile pass** — express flow looks great on a phone.
- [ ] 10. **Judge one-pager** — a simple printable summary of what Decode This does + the QR (coordinate with MK for the deploy URL).
