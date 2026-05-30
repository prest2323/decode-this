# Decode This — v2 PLAN (LOCKED)

> **This is the source of truth. It supersedes [`DESIGN-LOCKED.md`](./DESIGN-LOCKED.md).** That file describes the *old* app (snap a letter → plain explanation + reply). We pivoted. Read this file, not that one. Where the two disagree, this one wins.

**Name:** Decode This  ·  **Tagline:** *"Drop in any scary document. We protect you, then walk you through it — field by field."*

**One-liner:** A first-time small-business owner faces a 30+ page SBA loan application full of legal traps and tedious fields. Drop it in. Decode This gives a 3-sentence plain summary and surfaces the hidden traps, turns the whole thing into a step-by-step checklist, then opens the document inside our platform and walks you through it field by field — with on-document spotlights, guide text that never covers the field you're filling, a chat that knows the document and the step you're on, and one-click export of your filled form.

---

## 1. The vision — five capabilities, one document model

You drop in a complex document (hero = an **SBA 7(a) small-business loan application**). The AI does five things:

1. **PROTECT** — a 3-sentence plain-language summary, plus it surfaces the *hidden traps*: deadlines, fees, required background checks, personal-guarantee / legal risk. This is the "we have your back" moment — before you fill anything, you know what you're walking into.
2. **CHECKLIST** — it extracts **every** requirement into an interactive, step-by-step checklist. *"Step 1: Upload your 2025 tax return. Step 2: Get your EIN. Step 3: Fill the ownership section."* Some steps live **on the page** (a field to fill); some are **external prerequisites** (gather a document, pass a check, pay a fee). You check them off as you go.
3. **GUIDED** — it opens the document **inside our platform** and walks you field by field with on-document **spotlights** (intelligently grouped — street + city + state + zip in ONE spotlight), guide-text boxes placed so they **never** cover the field in focus, and you type directly into the fields.
4. **CHAT** — a context-aware widget grounded in the document **and** the step you're on (*"what's a personal guarantee?"*), plus broader *"what should I watch for later?"* Q&A.
5. **EXPORT** — your filled data is exportable in many formats: **PDF** (the real filled form), **JSON**, **CSV**, and **DOCX**.

Bilingual **EN/ES** everywhere — we carry the old app's accessibility strength forward.

---

## 2. The key insight — the atomic unit is a REQUIREMENT, not a "field"

This is the architecture and the pitch, in one sentence:

> **A field is just one *kind* of requirement. Protect, Checklist, and Guided are three lenses on the SAME requirement list.**

One extraction pass produces a single ordered list of **Requirements**. Everything else is a *view* of that list:

- **Protect** reads the requirements' flags (the traps) + the doc summary.
- **Checklist** renders the requirements as rows you check off.
- **Guided** walks the requirements that have an on-page `spotlight`, putting you in the fields.

No duplicated logic, no three-way drift. Extract once; render three ways. That's why this is a *platform*, not three demos taped together.

A `Requirement` carries a `type` — `"fill-field" | "gather-document" | "external-action" | "sign" | "pay-fee"` — so the same list naturally mixes *"fill the ownership section"* (on-page) with *"upload your 2025 tax return"* (external prerequisite). The checklist shows both; the guided tour only stops on the ones with a `spotlight`.

---

## 3. The contract — `lib/types.ts` (the spine, owned by Preston)

The whole app talks through one model: a `DocumentModel` made of `Requirement`s. **Preston owns this file.** Every change to it goes through him — announce it in chat and post "pull main."

```ts
type Lang = "en" | "es";
type RequirementType = "fill-field" | "gather-document" | "external-action" | "sign" | "pay-fee";
type Difficulty = "easy" | "medium" | "hard";
type ReqStatus = "todo" | "active" | "done";
type FlagKind = "deadline" | "fee" | "background-check" | "legal-risk" | "scam" | "tip";

interface Flag { kind: FlagKind; label: Record<Lang, string>; date?: string | null; }
interface Rect { page: number; x: number; y: number; w: number; h: number; } // NORMALIZED [0..1], origin top-left
interface Field { id: string; name: string; kind: "text"|"number"|"date"|"checkbox"|"radio"|"signature"; label: Record<Lang,string>; rect: Rect; value: string|boolean|null; required: boolean; options?: string[]; placeholder?: string; }
interface Requirement { id: string; order: number; type: RequirementType; difficulty: Difficulty; status: ReqStatus; title: Record<Lang,string>; guidance: Record<Lang,string>; flags: Flag[]; fields: Field[]; spotlight: Rect | null; }
interface DocPage { index: number; image: string; width: number; height: number; }
interface DocumentModel { id: string; fileName: string; docType: Record<Lang,string>; summary: Record<Lang,string>; pages: DocPage[]; requirements: Requirement[]; topFlags: Flag[]; }

// API
interface AnalyzeRequest { fileName: string; file: string; mime?: string; }
interface ChatRequest { question: string; lang: Lang; doc: DocumentModel; activeRequirementId?: string|null; }
interface ChatResult { answer: string; citedRequirementIds?: string[]; }
type ExportFormat = "pdf"|"json"|"csv"|"docx";
interface ExportRequest { doc: DocumentModel; format: ExportFormat; }
type ApiResponse<T> = { ok: true; result: T } | { ok: false; error: string };
```

**Three rules that keep this from drifting:**
- A `Rect` is **normalized** `{ page, x, y, w, h }` in `[0..1]`, origin **top-left**. Overlays multiply by the rendered canvas size. Never store pixels.
- Every user-facing string is `Record<Lang,string>` — render `label[lang]`, never a bare string.
- A requirement's `spotlight` is the **bounding box of its `fields[]`** (the "intelligently grouped" rule). If the model omits it, the normalizer computes it. Requirements with no on-page field (`gather-document`, `pay-fee`, etc.) have `spotlight: null` and are skipped by the guided tour but still appear in the checklist.

### Client state — `lib/store.ts` (React context + reducer, Preston ships it)

Components are **client components** that read everything from `useDoc()` — minimal prop threading:

```ts
const {
  doc,            // DocumentModel | null
  lang,           // "en" | "es"
  activeIndex,    // number — index into doc.requirements
  active,         // Requirement | null  (== doc.requirements[activeIndex])
  loadDoc,        // (doc) => void
  setLang,        // (l) => void
  goTo, next, prev,        // navigation (clamp at ends)
  setFieldValue,  // (fieldId, value) — immutable update across requirements[].fields[]
  setStatus,      // (reqId, status) — "todo"|"active"|"done"
  exportAs,       // (format) — "pdf"|"json"|"csv"|"docx"
} = useDoc();
```

The reducer is **immutable** (new objects on every change) so React re-renders, and `useDoc()` throws a clear error if used outside `<DocProvider>`.

---

## 4. Module map — who owns what (everyone DEEPENS their files in Phase 1)

Preston ships the whole template **compiling + running on mock**. Each person then makes *their* stub real.

| Owner | Files | What it is |
|---|---|---|
| **Preston** (Lead) | `lib/types.ts`, `lib/store.ts`, `lib/ai.ts` (provider client: Gemini default / Anthropic fallback / mock when no key), `app/api/analyze/route.ts`, `app/api/chat/route.ts`, `app/page.tsx` (Workspace layout), `app/layout.tsx` | The spine + the wiring + all merges + deploy |
| **Michael** | `lib/mock.ts` (the SBA `DocumentModel` mock — demo heart), `lib/extract.ts` (document → `DocumentModel`), `lib/chat.ts` (grounded answer), `lib/export.ts` (fill + multi-format), `lib/prompt.ts` (prompts + structured schemas), `scripts/eval.mjs` (eval harness) | The intelligence + the demo data + export |
| **Sawyer** | `components/DocCanvas.tsx` (render pages + overlay layer), `components/FieldOverlay.tsx` (editable input by normalized rect), `components/Spotlight.tsx` (SVG dim + cut-out hole), `components/Uploader.tsx` (drag/drop → `/api/analyze`), `app/globals.css` | The document canvas + spotlight + look & feel |
| **Aiden** | `components/ChecklistPanel.tsx`, `components/GuideBox.tsx` (collision-avoid placement), `components/TourController.tsx` (step nav + progress), `components/ChatWidget.tsx`, `components/RiskSummary.tsx` (Protect view), `demo/`, `PITCH.md` | The guidance UX + demo + pitch |

**Golden rule:** only edit files in your row. Any change to `lib/types.ts` goes through Preston.

---

## 5. The locked stack — verify the CURRENT API on Next 16 / React 19 / Tailwind v4

These are already in the repo. **Do not pick different libraries.** Do verify the current API of *these* against the installed versions before writing code.

- **Framework:** Next.js **16.2.6** (App Router), React **19.2**, Tailwind **v4**, `@google/genai` **^2.7**, `@anthropic-ai/sdk` **^0.100**. No DB.
- **PDF render (Sawyer):** `pdfjs-dist` — render each page to a canvas/raster, read the page viewport size, overlay an absolutely-positioned layer of inputs using **normalized** rects. Must configure the worker for the Next 16 App Router from a client component (`"use client"`). Verify worker setup + render snippet.
- **Field detection on import** is later. The analyzer (Michael) returns rects. For AcroForm PDFs, field rects/names can come from the annotation layer.
- **Fill + export (Michael):** `pdf-lib` — load the PDF, set AcroForm field values, flatten, download; plus trivial JSON/CSV; **DOCX is a stretch.** Verify the `pdf-lib` fill + flatten snippet.
- **Spotlight (Sawyer) + GuideBox (Aiden):** **custom, not a tour library.** Spotlight = a full-canvas dim `<svg>` with an evenodd/mask cut-out over the active requirement's `spotlight` rect. GuideBox = floats in the **largest free quadrant** relative to the spotlight so it never covers the focused field. This collision-free placement is something the design explicitly demanded — own it.
- **Chat (Michael):** **context-stuffed**, no vector DB. Pass the `DocumentModel` (summary + requirement titles/guidance) + the active requirement into the model. The doc is small and the demo must be fast.
- **Provider auto-select:** by which API key is set — `GEMINI_API_KEY` → Gemini (default), else `ANTHROPIC_API_KEY` → Anthropic (fallback), else **mock**. Structured JSON output either way.
- **Crash-proof normalization:** an off-spec model reply can **never** crash the UI. Coerce every `Record<Lang,string>` to `{en,es}` strings, clamp every `Rect` to `[0,1]`, default unknown `type`/`status`/`difficulty` to safe values, recompute a missing `spotlight` from `fields[]`. No key → return mock so everyone builds offline.

---

## 6. Build order — demoable vertical slice on mock FIRST

We protect the demo by making it real end-to-end on **mock data** before we touch real parsing.

**Phase 0 — template green (Preston, already shipping).** The whole manifest compiles and runs on mock with no API key. `npm run dev` works for everyone; `npm run build` is green. This is the floor.

**Phase 1 — the SBA vertical slice on mock (everyone, in parallel).**
Make the hero flow real, end to end, against `lib/mock.ts` only:
```
upload → analyze(mock) → PROTECT (summary + topFlags)
       → CHECKLIST (every requirement, on-page + external)
       → GUIDED (canvas + grouped spotlight tour, guide box never covers the field)
       → fill a field → CHAT answers grounded in the active requirement
       → EXPORT downloads
```
Nobody waits on the backend — everything is built against mock. This is the slice we can demo at any moment.

**Phase 2 — real render + real extraction + real export.**
- Sawyer: swap the mock page image for a real `pdfjs-dist` page render; overlay real inputs by normalized rect.
- Michael: `lib/extract.ts` turns a real document into a `DocumentModel` via structured JSON output; `lib/export.ts` fills the real AcroForm with `pdf-lib` and flattens to a downloadable PDF (plus JSON/CSV).
- Preston: wire `lib/ai.ts` to delegate to Michael's extract/chat when a key is present; harden the normalizer against off-spec replies.
Throughout, `?demo=1` ALWAYS returns the SBA mock — a network-proof hero moment on stage.

**Phase 3 — broaden.**
More file types (image-only docs, non-form PDFs), a second demo doc, DOCX export, deploy + QR. Only after the hero is bulletproof.

---

## 7. Cut list — what we are NOT building for the hackathon

- **No database, no auth, no accounts, no saved document history.** State lives in the client store for the session.
- **No real OCR pipeline / multi-document batch.** One document at a time; the analyzer returns rects.
- **No vector DB / RAG.** Chat is context-stuffed — the doc is small and the demo must be fast.
- **No fancy form-logic engine** (conditional fields, validation rules beyond `required`). Fill is direct.
- **DOCX export is a stretch**, not a commitment. PDF + JSON + CSV are the promise.
- **No collaborative / multi-user editing**, no comments, no e-signature integration (`sign` is a checklist step, not a real signing flow).
- **Don't gate the demo on the live API or on Vercel/QR** — the hero runs on baked mock (`?demo=1` is network-proof). Rehearse on localhost.
- **No theming beyond one calm light theme.** No dark mode, no streaming, no heavy animation. This app reduces anxiety; the UI should feel like it too.

---

## 8. Top risks → mitigations

| Risk | Mitigation |
|---|---|
| **Live model returns off-spec JSON and blanks the UI mid-demo** | Crash-proof normalizer in `lib/ai.ts`: coerce `{en,es}`, clamp rects to `[0,1]`, default enums, recompute `spotlight` from `fields[]`. Off-spec can never throw. |
| **Network hangs on stage** | `?demo=1` short-circuit in both routes ALWAYS returns the SBA mock. Rehearse on localhost; never make the API a demo gate. |
| **Guide box covers the field the user is typing in** (the thing the design explicitly forbids) | Collision-free placement math: pick the **largest free quadrant** relative to the spotlight, clamp on-canvas, recompute on `[active.id, W, H]`. Center it when `spotlight` is null. |
| **Spotlight feels noisy — one box per field** | The "intelligently grouped" rule: a requirement's spotlight is the **bounding box of all its fields** (street + city + state + zip = ONE highlight). Normalizer enforces it. |
| **pdfjs worker mis-configured on Next 16 App Router → blank canvas** | Configure the worker from a `"use client"` component; verify the worker setup + render snippet against the installed `pdfjs-dist` before building on it. |
| **pdf-lib can't fill the real SBA AcroForm (field names mismatch)** | Verify fill + flatten on the real form early. EXPORT must at least download `JSON.stringify(doc)` today, so the EXPORT beat never fails even if PDF fill lags. |
| **Three views drift out of sync** | They don't — they're three lenses on the SAME `Requirement[]`. One extraction, three renders. No duplicated logic to drift. |
| **Spanish breaks the bilingual story** | Every string is `Record<Lang,string>`; a `t(en, es)` helper covers UI chrome. Flip `setLang("es")` and the whole platform speaks Spanish — test it before the demo. |
| **Scope creep eats the 8-hour clock** | The cut list above is load-bearing. Mock-first vertical slice, then broaden. Protect the demo. |
