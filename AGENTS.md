# Agent rules for Decode This (READ BEFORE EDITING)

You are helping ONE teammate on a 4-person hackathon team. The whole plan is in `TEAM.md`.

## Hard rules — do not break these
1. **Only edit the files your operator names.** Each person owns a specific list (see the table in `TEAM.md`). Do NOT edit, rename, move, reformat, or "clean up" any other file — especially `lib/types.ts` (the shared contract). If a task seems to need a change elsewhere, STOP and tell your operator to ask the Lead.
2. **Do not refactor the repo.** No mass reformatting, no dependency changes, no restructuring. Make the smallest change that does the job.
3. **Git:** work only on the operator's branch (`ui-<name>`). Never commit to `main`. Never `git push --force`. Never `git add -A` blindly — add only the files you changed. Never commit `.env.local` or `node_modules`.
4. **Build against mock data.** `lib/mock.ts` provides realistic results; the API returns them when no key is set. You do not need secrets to build UI.
5. If you hit a merge conflict you don't fully understand, STOP and tell your operator to get the Lead.

## How the app fits together
- Contract: `lib/types.ts` (`DecodeResult`, `ExpressResult`). API: `POST /api/decode`.
- Components are presentational and each owned by one person. Keep the props stable; redesign internals freely.
- `app/page.tsx` (Lead-owned) wires everything — don't edit it unless you are the Lead.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
