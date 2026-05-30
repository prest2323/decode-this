# TEAM PLAYBOOK — Decode This (v2)

We are 4 people, each driving an AI. **Read your one-page job sheet in [`tasks/`](./tasks) — but read THIS whole file first.** It's 5 minutes and it's what stops us from stepping on each other.

> **What we're building now (the pivot):** You drop in ANY complex document — our hero is a real **SBA 7(a) small-business loan application** — and the app does five things:
> 1. **PROTECT** — a 3-sentence plain summary + surfaces the hidden traps (deadlines, fees, background checks, the personal-guarantee legal risk).
> 2. **CHECKLIST** — extracts EVERY requirement into an interactive step-by-step list ("Step 1: Upload your 2025 tax return", "Step 2: Get your EIN", "Step 3: Fill the ownership section").
> 3. **GUIDED** — opens the document IN our platform and walks you field-by-field with on-document **spotlights** and guide-text that never covers the field you're filling. You type straight into the page.
> 4. **CHAT** — a context-aware widget grounded in the document + the step you're on.
> 5. **EXPORT** — the filled data comes back out as PDF / JSON / CSV / DOCX.

---

## 🔑 THE KEY INSIGHT — everything is a Requirement

The atomic unit is a **Requirement**, not a "field." A field is just one KIND of requirement. The three big views — **Protect / Checklist / Guided** — are three lenses on the SAME `Requirement[]` list. Build with that in your head and the whole app stays coherent.

A Requirement can be:
- `fill-field` — something you type ON the page (street, EIN, loan amount).
- `gather-document` — a prerequisite you go get (your 2025 tax return).
- `external-action` — something off-page (pass a background check).
- `sign` — a signature.
- `pay-fee` — money due (the guaranty fee).

---

## 👥 Who owns what (the file manifest)

| Person + AI | Role | Owns these files ONLY |
|---|---|---|
| **Preston + Claude Code** | **Lead / Spine + Integration + Deploy** | `lib/types.ts` (THE CONTRACT), `lib/store.ts`, `lib/ai.ts`, `app/api/analyze/route.ts`, `app/api/chat/route.ts`, `app/page.tsx`, all merges + deploy |
| **Michael + Claude Code** | **Backend Engine** (ultrathink, heavy track) | `lib/mock.ts`, `lib/extract.ts`, `lib/chat.ts`, `lib/export.ts`, `lib/prompt.ts`, `scripts/eval.mjs` |
| **Sawyer + Antigravity (Gemini)** | **Document Canvas + Spotlight + Theme** | `components/DocCanvas.tsx`, `components/FieldOverlay.tsx`, `components/Spotlight.tsx`, `components/Uploader.tsx`, `app/globals.css` |
| **Aiden + Antigravity (Gemini)** | **Checklist / GuideBox / Tour / Chat + Demo + Pitch** | `components/ChecklistPanel.tsx`, `components/GuideBox.tsx`, `components/TourController.tsx`, `components/ChatWidget.tsx`, `components/RiskSummary.tsx`, `demo/`, `PITCH.md` |

**The golden rule: only edit files in YOUR row.** If you need a change to someone else's file — **especially `lib/types.ts`** — ask Preston in chat. **Preston owns the contract.** Nobody else changes types.

---

## 🤖 Which AI each teammate runs
- **Two of us run Claude Code** (Preston + Michael). The repo's `CLAUDE.md` auto-loads the rules.
- **Two of us run Antigravity with Gemini** (Sawyer + Aiden). Antigravity is Google's agentic IDE, built around Gemini with a generous free tier and native file-editing. The repo's `AGENTS.md` auto-loads the same rules for it.

---

## 📜 THE CONTRACT — the Requirement spine (Preston owns it)

Everything talks through [`lib/types.ts`](./lib/types.ts). The spine is a **`DocumentModel`** made of **`Requirement`s**:

```ts
DocumentModel { id, fileName, docType, summary, pages[], requirements[], topFlags[] }
Requirement   { id, order, type, difficulty, status, title, guidance, flags[], fields[], spotlight }
Field         { id, name, kind, label, rect, value, required, options?, placeholder? }
Rect          { page, x, y, w, h }   // NORMALIZED [0..1], origin top-left — multiply by rendered page size
Flag          { kind, label, date? } // deadline | fee | background-check | legal-risk | scam | tip
```

- All user-facing text is **bilingual**: `Record<Lang,string>` with `Lang = "en" | "es"`. Carry the old app's accessibility strength — EN/ES everywhere.
- A Requirement's **`spotlight`** is the bounding box of its fields. Group intelligently: street + city + state + zip = **ONE** spotlight.
- `status` is `todo | active | done`. `difficulty` is `easy | medium | hard` and drives tour order + how much hand-holding.

**The API:**
- `POST /api/analyze` → `{ fileName, file, mime? }` → `ApiResponse<DocumentModel>`
- `POST /api/chat` → `{ question, lang, doc, activeRequirementId? }` → `ApiResponse<ChatResult>`
- Export is client-side off the `DocumentModel` (`ExportFormat = pdf | json | csv | docx`).

**The client store (`lib/store.ts`) — consume it, don't prop-thread.** Components are CLIENT components that call `useDoc()`:
```ts
const { doc, lang, activeIndex, active,
        loadDoc, setLang, goTo, next, prev,
        setFieldValue, setStatus, exportAs } = useDoc();
```

**Build against [`lib/mock.ts`](./lib/mock.ts)** — with no API key, `/api/analyze` and `/api/chat` return the SBA mock. You never wait on the backend.

---

## 🌿 GIT RULES — how we don't wreck the repo
This is the most important section. **Tell your AI these rules explicitly.**

1. **Pull the new main first.** The v2 base template lives on `main`. Start with `git pull origin main`. Old branches are obsolete — branch fresh.
2. **Branch per person:** `git checkout -b phase1-<yourname>`.
3. **Never commit to `main`. Never `git push --force`.**
4. **Only touch files in your row** of the table above. Don't let your AI "helpfully" refactor shared files, rename things, or reformat the repo.
5. **Commit small, push often, add only your files:**
   ```bash
   git add <your files>          # never `git add -A` blindly
   git commit -m "feat: spotlight cut-out"
   git push origin phase1-<yourname>
   ```
6. **Never commit `.env.local` or `node_modules`** (gitignored — keep it that way).
7. If you hit a merge conflict you don't fully understand, **STOP and ping Preston.** Don't auto-resolve.

> Paste this to your AI at the start: *"Only edit the files I name. Do not refactor, rename, reformat, or touch any other file. Preston owns lib/types.ts — never edit it. Work on my branch phase1-<name>. Never force-push."*

---

## 🧱 Base template — what Preston already shipped
Preston ships the WHOLE app compiling + running on mock. Every component is a working stub. **Phase 1 = make YOUR files real / deepen them.** You never start from a blank file, and the demo is green from minute one.

- **Preston (real):** `lib/types.ts`, `lib/store.ts`, `lib/ai.ts`, `app/api/analyze/route.ts`, `app/api/chat/route.ts`, `app/page.tsx`.
- **Michael (stubs → deepen):** `lib/mock.ts`, `lib/extract.ts`, `lib/chat.ts`, `lib/export.ts`, `lib/prompt.ts`, `scripts/eval.mjs`.
- **Sawyer (stubs → deepen):** `components/DocCanvas.tsx`, `components/FieldOverlay.tsx`, `components/Spotlight.tsx`, `components/Uploader.tsx`, `app/globals.css`.
- **Aiden (stubs → deepen):** `components/ChecklistPanel.tsx`, `components/GuideBox.tsx`, `components/TourController.tsx`, `components/ChatWidget.tsx`, `components/RiskSummary.tsx`, `demo/`, `PITCH.md`.

---

## ⏱️ Timeline (8 hours)
| Time | What |
|---|---|
| 0:00–0:30 | Everyone pulls new `main`, `npm install`, `npm run dev` works, reads their queue + branches `phase1-<name>` |
| 0:30–3:30 | Parallel build against the SBA mock — the demoable vertical slice |
| 3:30–4:30 | **Integration #1** — Preston wires real analyze/extract; everyone pulls `main` |
| 4:30–6:30 | Polish: spotlight tour, collision-free guide boxes, chat, export, EN/ES |
| 6:30–7:30 | Deploy + QR, rehearse the 90-sec pitch 3× |
| 7:30–8:00 | **CODE FREEZE.** Final rehearsal only. |

---

## 🏆 What we're judged on (and who owns each)
Judges score **usefulness, execution, clarity, learning.**
- **Usefulness** → a real local person facing a real scary form (the SBA 7(a)) gets it done. Aiden's demo + Michael's extraction carry this.
- **Execution** → small scope, clean file ownership, build green to the 7:30 freeze (everyone).
- **Clarity** → the document canvas + spotlight reads across a room; the checklist is obvious. Sawyer + Aiden.
- **Learning** → the "what we learned" slide (Aiden in `PITCH.md`).
- **Creativity hook** → the Requirement spine: ONE list, three lenses; on-document spotlights with guide-text that never covers the field. Preston's contract + Sawyer's canvas.

**The demo money moment:** drop in the SBA 7(a) loan app → the screen lights up with the traps (personal guarantee! guaranty fee! deadline!), turns the whole monster into a numbered checklist, then **walks you field-by-field with a spotlight** while you type — and exports a filled PDF at the end. Aiden scripts it, Sawyer makes the canvas flawless.
