# Agent rules for Decode This v2 (READ BEFORE EDITING)

You are helping ONE teammate on a 4-person hackathon team. The whole plan is in `TEAM.md`; your specific job is in `tasks/queue-<name>.md`.

## Hard rules — do not break these
1. **Only edit the files your operator names.** Each person owns a specific list (see the table in `TEAM.md`). Do NOT edit, rename, move, reformat, or "clean up" any other file — **especially `lib/types.ts`, the shared contract. Preston (Lead) owns `lib/types.ts`; nobody else changes a type.** If a task seems to need a change to a type or someone else's file, STOP and tell your operator to ask Preston.
2. **Do not refactor the repo.** No mass reformatting, no dependency changes, no restructuring, no swapping the locked libraries (`pdfjs-dist`, `pdf-lib`, `@google/genai`, `@anthropic-ai/sdk`, Tailwind v4). Make the smallest change that does the job.
3. **Git:** work only on the operator's branch (`phase1-<name>`). Pull the new `main` before you start. Never commit to `main`. Never `git push --force`. Never `git add -A` blindly — add only the files you changed. Never commit `.env.local` or `node_modules`.
4. **Build against the mock.** `lib/mock.ts` returns a full SBA `DocumentModel`; the API returns it when no key is set. You never need secrets and never wait on the backend.
5. If you hit a merge conflict you don't fully understand, STOP and tell your operator to get Preston. Don't auto-resolve.
6. **Announce which file you're editing before you edit it.**

## This is NOT the Next.js / React you may know
Next.js 16.2.6 (App Router), React 19.2, Tailwind v4. These have breaking changes from older versions — APIs, conventions, file structure may differ from your training data. **Verify the CURRENT API** before writing code (the locked-stack notes in your queue point at the specific snippets — `pdfjs-dist` worker setup for the App Router, `pdf-lib` fill + flatten, etc.). Heed deprecation notices.

## How the app fits together
- **The spine** is `lib/types.ts`: a **`DocumentModel`** (`id, fileName, docType, summary, pages[], requirements[], topFlags[]`) made of **`Requirement`s**. A `Requirement` has a `type` (`fill-field | gather-document | external-action | sign | pay-fee`), a `difficulty`, a `status` (`todo | active | done`), bilingual `title`/`guidance`, `flags[]`, `fields[]`, and a `spotlight` rect. The atomic unit is the **Requirement** — a field is just one KIND of it.
- **Three views, one list.** Protect (summary + `topFlags`), Checklist (the `requirements[]` as steps), and Guided (the canvas tour) are three lenses on the same `requirements[]`.
- **Rects are NORMALIZED** `[0..1]` with origin top-left. Multiply by the rendered page size to position overlays/spotlights. A Requirement's `spotlight` is the bounding box of its fields (street + city + state + zip = ONE spotlight).
- **Bilingual everywhere.** All user-facing text is `Record<Lang,string>` with `Lang = "en" | "es"`.
- **The store** (`lib/store.ts`) is a React context + reducer. Components are CLIENT components that call `useDoc()` for `{ doc, lang, activeIndex, active, loadDoc, setLang, goTo, next, prev, setFieldValue, setStatus, exportAs }`. Read/write the store — don't prop-thread.
- **The API:** `POST /api/analyze` (`{ fileName, file, mime? }` → `DocumentModel`) and `POST /api/chat` (`{ question, lang, doc, activeRequirementId? }` → `ChatResult`). Both return `ApiResponse<T>` = `{ ok: true, result } | { ok: false, error }`. Provider auto-selects by which API key is set; no key → mock.
- `app/page.tsx` (Preston-owned Workspace) wires every view to the store — don't edit it unless you are Preston.
