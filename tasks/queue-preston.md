# 🔁 PRESTON'S PHASE-1 QUEUE — Lead: Spine + Integration + Deploy

> You own the contract and the wiring. **Pull the new `main` first** (`git pull origin main`), then `git checkout -b phase1-preston`. The template ships every file compiling + running on mock — your job is to harden the spine, wire real provider extraction once Michael lands `lib/extract.ts`, integrate teammates into `main` keeping `npm run build` green, and deploy. AI: **Claude Code (you're the Lead)**. You are the ONLY person who edits `lib/types.ts` — every contract change goes through you, announce it in chat and post "pull main."

## You own
`lib/types.ts`, `lib/store.ts`, `lib/ai.ts`, `app/api/analyze/route.ts`, `app/api/chat/route.ts`, `app/page.tsx`, `app/layout.tsx` (Providers wrap), plus all merges, deploy, branch hygiene.
**Do NOT edit (other people's files):** `lib/mock.ts` `lib/extract.ts` `lib/chat.ts` `lib/export.ts` `lib/prompt.ts` `scripts/eval.mjs` (Michael) · `components/DocCanvas.tsx` `components/FieldOverlay.tsx` `components/Spotlight.tsx` `components/Uploader.tsx` `app/globals.css` (Sawyer) · `components/ChecklistPanel.tsx` `components/GuideBox.tsx` `components/TourController.tsx` `components/ChatWidget.tsx` `components/RiskSummary.tsx` `demo/` `PITCH.md` (Aiden). Touch them only to *merge* their PRs into main.

## The loop (never sit idle)
Do the first unchecked `[ ]` task → test (`npm run dev`, no key = mock) → `npm run build` must pass → mark `[x]` → `git add` ONLY your files → commit small → `git push origin phase1-preston` → tell the team "✅ Done: X" + "pull main" when you've merged → next. Queue empty → "🟢 Queue empty, on merges + deploy." Never push to `main` directly except merged PRs, never force-push, never `git add -A` blindly, never commit `.env.local`/`node_modules`. When you merge a teammate, immediately re-run `npm run build` before pushing main.

## The queue (priority order)

- [ ] **1. 🔴 SHIP THE CONTRACT — `lib/types.ts`.** This unblocks all 4 people. Replace the old `DecodeResult/ExpressResult` shapes with the v2 spine EXACTLY as specced: `Lang`, `RequirementType` (`"fill-field"|"gather-document"|"external-action"|"sign"|"pay-fee"`), `Difficulty`, `ReqStatus` (`"todo"|"active"|"done"`), `FlagKind`, `Flag`, `Rect` (normalized `[0..1]`, origin top-left), `Field`, `Requirement`, `DocPage`, `DocumentModel`, `AnalyzeRequest`, `ChatRequest`, `ChatResult`, `ExportFormat`, `ExportRequest`, and the generic `type ApiResponse<T> = { ok: true; result: T } | { ok: false; error: string }`. Keep the "frozen contract — coordinate changes through Preston" header comment. Commit FIRST, push, post "✅ contract live — pull main."

- [ ] **2. 🔴 CLIENT STORE — `lib/store.ts`.** React 19 context + `useReducer`. Export a `DocProvider` (client component, `"use client"` at top) and the `useDoc()` hook. State: `{ doc: DocumentModel|null; lang: Lang; activeIndex: number }`; derive `active: Requirement|null = doc?.requirements[activeIndex] ?? null`. Actions: `loadDoc(doc)`, `setLang(l)`, `goTo(i)`, `next()`, `prev()` (clamp to `[0, requirements.length-1]`), `setFieldValue(fieldId, value)` (find the field across `requirements[].fields[]`, set `.value`), `setStatus(reqId, status)`, `exportAs(format)` (calls Michael's `lib/export.ts` — see task 8). Use the verified React 19 pattern — split null-check helper so a component outside the provider throws a clear error:
  ```ts
  "use client";
  const Ctx = createContext<DocStore | null>(null);
  export function useDoc() {
    const v = useContext(Ctx);
    if (!v) throw new Error("useDoc must be used inside <DocProvider>");
    return v;
  }
  ```
  `setFieldValue`/`setStatus` must return NEW objects (immutable reducer) so React re-renders. Ship a tiny in-file default so components compile before Michael's mock lands.

- [ ] **3. 🔴 PROVIDER WRAP — `app/layout.tsx`.** Root layout is a Server Component; you cannot put context there directly. Wrap `{children}` in `<DocProvider>` imported from `lib/store.ts`. Keep `<html lang>`/`<body>` here, render `<DocProvider>{children}</DocProvider>` inside `<body>`. (Verified Next 16 pattern: the provider is the `"use client"` boundary, children stay server-renderable.)

- [ ] **4. 🔴 PROVIDER CLIENT — `lib/ai.ts`.** The auto-select brain. Export `provider(): "gemini"|"anthropic"|"mock"` — `GEMINI_API_KEY` → gemini (default), else `ANTHROPIC_API_KEY` → anthropic (fallback), else `"mock"`. Export thin `analyzeDoc(req: AnalyzeRequest): Promise<DocumentModel>` and `chat(req: ChatRequest): Promise<ChatResult>` that branch on `provider()` and, when not mock, delegate to Michael's `lib/extract.ts` / `lib/chat.ts`. **Until Michael lands those, return `MOCK_DOC` / a mock chat answer** so the whole app runs offline. Keep CRASH-PROOF normalization here (or call Michael's): an off-spec model reply must never crash the UI — coerce every `Record<Lang,string>` to `{en,es}` strings, clamp `Rect` values to `[0,1]`, default unknown `urgency`/`status`/`type` to safe values. SDK is `@google/genai ^2.7` (`new GoogleGenAI({apiKey})`, `models.generateContent({model, contents, config:{responseMimeType:"application/json", responseSchema}})`) and `@anthropic-ai/sdk ^0.100`.

- [ ] **5. 🔴 ANALYZE ROUTE — `app/api/analyze/route.ts`.** Next 16 App Router handler. Verified shape:
  ```ts
  export const runtime = "nodejs";
  export const maxDuration = 60;
  export async function POST(req: Request) {
    let body: AnalyzeRequest;
    try { body = await req.json(); } catch { return Response.json({ ok:false, error:"Invalid JSON." } satisfies ApiResponse<DocumentModel>, { status:400 }); }
    if (!body.file?.startsWith?.("data:")) return Response.json({ ok:false, error:"Drop a PDF or image first." }, { status:400 });
    try { const result = await analyzeDoc(body); return Response.json({ ok:true, result } satisfies ApiResponse<DocumentModel>); }
    catch (e) { console.error(e); return Response.json({ ok:false, error:"Analyze failed. Try again." }, { status:400 }); }
  }
  ```
  Add a `?demo=1` short-circuit that ALWAYS returns `MOCK_DOC` (network-proof hero moment on stage). Return type is `ApiResponse<DocumentModel>`.

- [ ] **6. 🔴 CHAT ROUTE — `app/api/chat/route.ts`.** Same handler pattern; body is `ChatRequest` (`{ question, lang, doc, activeRequirementId? }`). Validate `question` non-empty, call `chat(body)` from `lib/ai.ts`, return `ApiResponse<ChatResult>`. Add the same `?demo=1` mock-answer short-circuit. This is what grounds Aiden's `ChatWidget` — keep the contract tight: `{ answer: string; citedRequirementIds?: string[] }`.

- [ ] **7. 🔴 WORKSPACE LAYOUT — `app/page.tsx`.** The page that wires every component via `useDoc()` — minimal prop threading. `"use client"`. Compose: `<Uploader/>` (Sawyer) → on success calls `loadDoc(result)`; left rail = `<RiskSummary/>` + `<ChecklistPanel/>` (Aiden); center = `<DocCanvas/>` with `<Spotlight/>` + `<FieldOverlay/>` (Sawyer); bottom = `<TourController/>` (Aiden, drives `next/prev/goTo`); floating `<ChatWidget/>` (Aiden); a lang `<button>` toggling `setLang`. Three-lens switch (Protect/Checklist/Guided) over the SAME requirement list. Every component already ships as a compiling stub — your job is the LAYOUT + wiring, not their internals. Get the vertical slice green: upload → analyze(mock) → checklist + canvas + spotlight + fill + chat + export.

- [ ] **8. EXPORT WIRING — `lib/store.ts` `exportAs(format)`.** Wire the trigger to Michael's `lib/export.ts`. For a hackathon-fast client path, import his `fillAndExport(doc, format)` and trigger a browser download (Blob → object URL → `<a download>` click → revoke). pdf-lib runs client-side fine. Verified fill+flatten (Michael owns the impl, you own the call + download):
  ```ts
  const pdfDoc = await PDFDocument.load(formPdfBytes);
  const form = pdfDoc.getForm();
  form.getTextField(name).setText(value);   // checkbox: form.getCheckBox(name).check()
  form.flatten();
  const bytes = await pdfDoc.save();         // Uint8Array → Blob → download
  ```
  If Michael isn't done, `exportAs("json")` must at least download `JSON.stringify(doc)` so EXPORT demos today.

- [ ] **9. MERGE PASS #1 — integrate teammates into `main`.** As Sawyer/Michael/Aiden push `phase1-*` branches: review, merge into `main`, **re-run `npm run build` after EACH merge**, resolve conflicts (you own `types.ts`/`page.tsx` so most conflicts route to you), push `main`, post "pull main." Never let `main` go red. If a teammate's PR breaks the build, hold the merge and ping them — don't "fix" their file silently.

- [ ] **10. CONTRACT HARDENING — `lib/ai.ts` normalization.** Once real Gemini extraction (`lib/extract.ts`) is wired, throw a few off-spec replies at it: missing `es`, `Rect` out of `[0,1]`, unknown `RequirementType`, a `Requirement` with zero fields, `spotlight: null`. Confirm the normalizer never throws and the UI never blanks. Add a `normalizeDoc(raw): DocumentModel` that fills `order`/`status`/`difficulty` defaults and recomputes each requirement's `spotlight` as the bounding box of its `fields[].rect` when the model omits it (the "intelligently grouped" spotlight rule).

- [ ] **11. REAL PROVIDER SWAP — env + smoke test.** Put `GEMINI_API_KEY` in `.env.local`, run a real SBA-ish PDF through `/api/analyze`, confirm a valid `DocumentModel` comes back and the canvas/spotlight tour renders against REAL rects (not just mock). Keep `?demo=1` as the stage fallback. Confirm no-key → mock still works (teammates depend on it).

- [ ] **12. DEPLOY — Vercel + QR (stretch).** `npx vercel`, set `GEMINI_API_KEY` (or `ANTHROPIC_API_KEY`) in the dashboard, set `MODEL`/`GEMINI_MODEL` if overriding, confirm the live URL, hit `…/?demo=1`-style path to prove the network-proof demo, generate a **QR code** for judges, hand the URL to the team. Confirm `runtime="nodejs"` + `maxDuration=60` survive the deploy.

- [ ] **13. FINAL GREEN — pre-demo integration sweep.** Pull every merged branch, `npm run build` + `npm run dev`, walk the full hero flow on the SBA mock: upload → Protect summary + topFlags → Checklist → Guided spotlight tour (grouped rects, guide box never covers the field) → fill a field → Chat answers grounded in the active requirement → Export downloads. Log anything off in chat, fix only in YOUR files, re-merge. Protect the demo.
