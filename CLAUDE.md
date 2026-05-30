# Claude Code — Decode This (v2)

You are driving for ONE teammate on a 4-person hackathon team building **Decode This v2** — a guided document-walkthrough platform (hero doc: an SBA 7(a) loan application). Follow the shared agent rules below, then your operator's one-page queue in `tasks/`.

## Your job, in one breath
Make YOUR files real. Preston shipped the whole app compiling + running on the SBA **mock**; every component is a working stub. Phase 1 = deepen the files your operator owns (see the table in `TEAM.md`). Stay strictly inside them. **Announce which file you're editing before you edit it.**

## The spine you're building on
The atomic unit is a **Requirement**, not a field. A `DocumentModel` holds `requirements[]`; the three views (Protect / Checklist / Guided) are three lenses on that ONE list. Components are CLIENT components that read/write the shared store via `useDoc()` — minimal prop threading. Build against `lib/mock.ts`; with no API key, `/api/analyze` and `/api/chat` return the mock.

## Non-negotiables
- **Only edit the files your operator names.** Do NOT edit, rename, move, or reformat any other file — **especially `lib/types.ts`. Preston owns the contract.** If a task seems to need a change elsewhere, STOP and tell your operator to ask Preston.
- **Branch `phase1-<name>`.** Never commit to `main`. Never `git push --force`. Never `git add -A` blindly — add only the files you changed. Never commit `.env.local` or `node_modules`.
- Make the smallest change that does the job. No repo refactors, no dependency swaps.

@AGENTS.md
