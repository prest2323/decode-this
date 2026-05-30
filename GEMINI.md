# Gemini — Decode This (READ BEFORE EDITING)

You are helping ONE teammate on a 4-person hackathon team. The full plan is in `TEAM.md`; your operator's one-page job sheet is in `tasks/`.

## Hard rules — do not break these
1. **Only edit the files your operator names** (see the ownership table in `TEAM.md`). Do NOT edit, rename, reformat, or "improve" any other file — especially `lib/types.ts` (the shared contract). If you think you need a change elsewhere, STOP and tell your operator to ask the Lead.
2. **No refactoring, no dependency changes, no reformatting the repo.** Smallest change that works.
3. **Git:** work only on the operator's branch (`ui-<name>`). Never commit to `main`. Never `git push --force`. Add only the files you changed (never `git add -A` blindly). Never commit `.env.local` or `node_modules`.
4. **Build against mock data** in `lib/mock.ts` — no API key needed for UI work.
5. Merge conflict you don't fully understand? STOP and get the Lead.

## How the app fits together
- Contract: `lib/types.ts` (`DecodeResult`, `ExpressResult`). API: `POST /api/decode`.
- Components are presentational, one owner each. Keep the props stable; redesign internals freely.
- `app/page.tsx` is Lead-owned — don't touch it.

> This is the latest Next.js (App Router, TypeScript, Tailwind). If unsure about a Next.js API, check `node_modules/next/dist/docs/` instead of guessing.
