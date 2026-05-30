# 01 · LEAD (Preston + Claude Code) — Backend & Integrator

**You own:** `lib/types.ts`, `lib/gemini.ts`, `app/api/decode/route.ts`, `app/page.tsx`, deploy, all merges.
**MK owns** `lib/prompt.ts` + `lib/mock.ts` — coordinate, don't edit them.

## Your job
1. **Guard the contract.** You alone edit `lib/types.ts`. Announce any change to the whole team. (Already changed: `draftReply` is now bilingual `Record<Lang,string>`.)
2. **Wire the real API** — Gemini is the free default: `cp .env.example .env.local`, set `GEMINI_API_KEY` (https://aistudio.google.com/apikey). Test decode + express against real Gemini. (`ANTHROPIC_API_KEY` is an optional fallback only.)
3. **Integrate.** As teammates push branches, review/merge into `main`, keep it green, post "pull main" in chat.
4. **Deploy (stretch).** `npx vercel` → set `GEMINI_API_KEY` in the Vercel dashboard → URL + QR.

## Test
```bash
# express (text in -> words out)
curl -s localhost:3000/api/decode -H "content-type: application/json" \
  -d '{"mode":"express","text":"mi hijo esta enfermo no puede ir a la escuela","lang":"en"}'
# decode needs a base64 image data URL — easiest to test in the browser UI.
# Network-proof demo path (always returns baked mock): /api/decode?demo=1
```

## Definition of done
- [ ] `GEMINI_API_KEY` wired; decode + express both return good results on a real document
- [ ] All 7 components merged into `main` and working end-to-end
- [ ] Spanish read-aloud works in the demo browser (test with Sawyer)
- [ ] Deployed URL + QR (stretch)
- [ ] **7:30 PM: freeze `main`.** No merges after.

## Merge ritual
```bash
git checkout main && git pull
git merge ui-<name>
npm run build           # must pass before you push main
git push origin main
```
Tell everyone to `git pull origin main` after each merge so they stay in sync.
