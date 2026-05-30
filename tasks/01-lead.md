# 01 · LEAD (You + Claude Code) — Backend & Integrator

**You own:** `lib/types.ts`, `lib/prompt.ts`, `lib/mock.ts`, `app/api/decode/route.ts`, `app/page.tsx`, deploy, all merges.

## Your job
1. **Guard the contract.** You are the only one who edits `lib/types.ts`. If someone needs a field, you add it and tell the team.
2. **Get the real API working** (already scaffolded in `app/api/decode/route.ts`):
   - Add your key: `cp .env.example .env.local`, set `ANTHROPIC_API_KEY`.
   - Test decode + express against real Claude (see "Test" below). Tune prompts in `lib/prompt.ts`.
3. **Integrate.** As teammates push components, pull their branches, wire them in `app/page.tsx`, resolve conflicts, merge to `main`.
4. **Deploy (stretch).** `npx vercel` → add `ANTHROPIC_API_KEY` in the Vercel dashboard → get a URL + make a QR code for judges.

## Test
```bash
# express (text in -> words out)
curl -s localhost:3000/api/decode -H "content-type: application/json" \
  -d '{"mode":"express","text":"mi hijo esta enfermo no puede ir a la escuela","lang":"en"}'

# decode needs an image as a base64 data URL — easiest to test in the browser UI.
```

## Definition of done
- [ ] Real Claude key wired; decode + express both return good results
- [ ] All 6 components merged into `main` and working end-to-end
- [ ] Spanish read-aloud works in the demo browser (test with Person 3)
- [ ] Deployed URL + QR (stretch)
- [ ] **7:30 PM: freeze `main`.** No merges after.

## Merge ritual
```bash
git checkout main && git pull
git merge ui-<name>     # or review the PR
npx tsc --noEmit        # must pass before you push main
git push origin main
```
Tell everyone to `git pull origin main` after each merge so they stay in sync.
