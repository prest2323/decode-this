# 🔁 MICHAEL'S PHASE-1 QUEUE — Backend Engine (HEFTY track)

> You build the BRAIN: a real document → a full `DocumentModel`. The whole demo — Protect, Checklist, Guided, Chat, Export — reads the spine you produce. Go deep; this is the hardest track on the team.
>
> **Pull the new main first:** `git pull origin main` → `git checkout -b phase1-michael`. Old branches are dead.
> **AI:** Claude Code (ultrathink). **Provider:** Gemini default / Anthropic fallback / **mock when no key** — everyone, including you, builds offline against `lib/mock.ts`.
> **Contract reminder:** the atomic unit is a **`Requirement`**, NOT a field. A `Field` is one *kind* of requirement (`type: "fill-field"`). Protect / Checklist / Guided are three lenses on the SAME `Requirement[]`. `lib/types.ts` is **Preston's** — if you need a shape change, ping him; never edit it yourself. Every user-facing string is `Record<Lang,string>` (en+es). Rects are NORMALIZED `[0..1]`, origin top-left.

## You own
`lib/extract.ts`, `lib/prompt.ts`, `lib/chat.ts`, `lib/export.ts`, `lib/mock.ts`, `scripts/eval.mjs`

## Do NOT edit (other people's files)
`lib/types.ts` + `lib/store.ts` + `lib/ai.ts` + `app/api/*` + `app/page.tsx` (Preston). `components/*` + `app/globals.css` (Sawyer/Aiden). `demo/` + `PITCH.md` (Aiden). If a task seems to need a change in one of these, STOP and ping Preston — don't reach across the fence.

## The loop (never sit idle)
Do the first unchecked `[ ]` task → test (`npm run dev`, hit the flow on the SBA mock; for AI tasks put a key in `.env.local`) → mark `[x]` → `git add` ONLY your files → commit small → `git push origin phase1-michael` → ping Preston “✅ Done: X” → next. Queue empty → “🟢 Queue empty.” Never push to `main`, never force-push, never `git add -A`, never commit `.env.local`/`node_modules`.

## The queue (priority order — demo-critical first)

- [x] 1. **🔴 THE DEMO HEART — rich SBA 7(a) mock** (`lib/mock.ts`). Export `MOCK_SBA: DocumentModel` (and a re-export the API can fall back to). Make it *real*: `docType`/`summary` bilingual, 8–10 `requirements` spanning **every** `RequirementType` — `gather-document` (2025 tax return, EIN letter), `external-action` (background/ownership check), `fill-field` (business legal name + the grouped **address** block: street+city+state+zip in ONE requirement with ONE `spotlight`), `pay-fee` (SBA guaranty fee), `sign` (personal-guarantee signature). Each requirement: `order`, `difficulty`, `status:"todo"`, bilingual `title`+`guidance`, real `flags`, and for `fill-field` a `fields: Field[]` with NORMALIZED `rect`s + a `spotlight` = the bounding box of those fields. Set `topFlags` to the scary ones (personal guarantee = `legal-risk`, guaranty fee = `fee`, application deadline = `deadline` with a real `date`, ownership/background = `background-check`). One synthetic `pages[0]` (`image` can be a placeholder data-URL or `/demo/sba.png`, with `width`/`height`). **This unblocks all 3 other people** — ship it first, ship it polished. _(Preston's stub already met the spec — 9 requirements across all 5 RequirementTypes, grouped address → ONE spotlight, dated topFlags. Added the canonical `MOCK_SBA` export (kept `MOCK_DOC` as the API fallback). build green.)_

- [x] 2. **Normalizer = crash-proof spine** (`lib/extract.ts` → export `normalizeDoc(raw: unknown): DocumentModel`). An off-spec model reply must NEVER crash the UI. Coerce every field: default missing `Record<Lang,string>` to `{en:"",es:""}` (fill `es` from `en` if absent), clamp every `Rect` number to `[0..1]`, force `type`/`difficulty`/`status`/`FlagKind` into their unions (drop/repair unknowns), assign `order` by array index if missing, dedupe/repair `id`s, guarantee arrays are arrays. Re-derive every `fill-field` requirement's `spotlight` from the bounding box of its `fields` rects so grouping is always consistent. This function is the *only* thing the API trusts — mock and live both pass through it. _(Wrote `normalizeDoc`: coerces every field, fills `es` from `en`, clamps rects to [0..1], repairs `type`/`difficulty`/`status`/`FlagKind` unions, dedupes ids, re-derives fill-field spotlights as padded bbox. Wired the mock fallback through it; `/api/analyze` verified — 9 reqs, all 5 types, address→ONE spotlight, all rects in range. Adversarial garbage tests land in tasks 8/12.)_

- [ ] 3. **Multimodal extraction prompt + JSON schema** (`lib/prompt.ts`). Export `EXTRACT_SYSTEM` (string) and `extractSchema` mirroring `DocumentModel` for **constrained** generation. Instruct the model: return the 3-sentence plain `summary`, `docType`, `topFlags`, and a `Requirement[]`. For `@google/genai` build the schema with the `Type` enum, e.g.
  ```ts
  import { Type } from "@google/genai";
  export const extractSchema = { type: Type.OBJECT, properties: {
    docType: { type: Type.OBJECT, properties: { en:{type:Type.STRING}, es:{type:Type.STRING} } },
    summary:{ /* en/es */ }, topFlags:{ type:Type.ARRAY, items:{ /* Flag */ } },
    requirements:{ type:Type.ARRAY, items:{ type:Type.OBJECT, properties:{
      id:{type:Type.STRING}, order:{type:Type.INTEGER},
      type:{type:Type.STRING, enum:["fill-field","gather-document","external-action","sign","pay-fee"]},
      difficulty:{type:Type.STRING, enum:["easy","medium","hard"]},
      title:{/* en/es */}, guidance:{/* en/es */}, flags:{type:Type.ARRAY,items:{/* */}},
      fields:{type:Type.ARRAY,items:{/* id,name,kind,label{en,es},rect{page,x,y,w,h},required */}},
    }}}}, required:["docType","summary","requirements"] } as const;
  ```
  Bake in the rules: spotlights are the bounding box of grouped fields, rects are normalized `[0..1]`, **never invent** doc facts. Add 1–2 short **few-shot** examples (a form snippet → its Requirement). NOTE: Gemini wants `config.responseMimeType:"application/json"` + `responseSchema`; Anthropic wants `output_config.format = { type:"json_schema", schema }`.

- [ ] 4. **Real analyzer: document → DocumentModel** (`lib/extract.ts` → `extractDoc(req: AnalyzeRequest): Promise<DocumentModel>`). Use Preston's provider client in `lib/ai.ts` (don't re-init keys). Send the file as **multimodal**: base64 in an `inlineData` part (`mimeType:"application/pdf"` for PDFs, `image/jpeg|png` for images). Verified Gemini call:
  ```ts
  import { GoogleGenAI, Type } from "@google/genai";
  const res = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ role:"user", parts:[ { text: EXTRACT_SYSTEM },
      { inlineData: { mimeType: req.mime ?? "application/pdf", data: base64 } } ]}],
    config: { responseMimeType:"application/json", responseSchema: extractSchema },
  });
  const raw = JSON.parse(res.text);
  ```
  (Strip any `data:...;base64,` prefix before sending.) Then **always** `return normalizeDoc(raw)`. If no key → return `MOCK_SBA`. Anthropic fallback uses `messages.parse({ output_config:{ format:{ type:"json_schema", schema } } })` with a `{type:"document",source:{type:"base64",media_type:"application/pdf",data}}` block and reads `message.parsed_output`. Wrap in try/catch → on any failure fall back to mock so the demo never dies.

- [ ] 5. **Grouping + difficulty pass** (`lib/extract.ts` → `groupAndOrder(reqs): Requirement[]`, run inside `normalizeDoc`). (a) **Group**: collapse adjacent `fill-field` requirements whose fields are the same logical unit (address: street+city+state+zip; full name parts) into ONE requirement with ONE `spotlight` = the union bounding box — the user explicitly demanded street+city+state+zip in a single spotlight. (b) **Score difficulty**: `gather-document`/`external-action`/`sign`/`pay-fee` skew harder; a lone text field is `easy`. (c) **Order the tour**: prerequisites (gather/external) before on-page fills; within that, easy → hard so the user warms up. Set each `order` to the final index. Unit-eyeball it against the SBA mock.

- [ ] 6. **Grounded chat** (`lib/chat.ts` → `answer(req: ChatRequest): Promise<ChatResult>`). Context-stuff: pass `doc.summary` + `doc.docType` + every requirement's `title`/`guidance` + (if `activeRequirementId`) the **active** requirement verbatim into the model. Answer in `req.lang` (bilingual-aware), **never invent doc facts** — if it's not in the doc, say so and suggest who to ask. Return `{ answer, citedRequirementIds }` populated from which requirements you grounded on (Aiden's `ChatWidget` highlights them). No key → a deterministic mock answer keyed off the active requirement so the chat demos offline.

- [ ] 7. **Export: fill + multi-format** (`lib/export.ts` → `exportDoc(doc, format: ExportFormat): Promise<Blob>`). `npm i pdf-lib`. **PDF** (the money format): load the original PDF bytes, fill AcroForm values from each `Field.value`, flatten, save → verified pattern:
  ```ts
  import { PDFDocument } from "pdf-lib";
  const pdf = await PDFDocument.load(originalBytes);
  const form = pdf.getForm();
  const f = form.getFieldMaybe(field.name);              // null-safe: skip if the field isn't in the AcroForm
  if (f && field.kind==="checkbox") (f as any).check?.();
  else if (f) form.getTextField(field.name).setText(String(field.value ?? ""));
  form.flatten();
  const bytes = await pdf.save();                         // Uint8Array → new Blob([bytes],{type:"application/pdf"})
  ```
  Use `getFieldMaybe` everywhere so a name mismatch never throws. **JSON** = `JSON.stringify(doc)`. **CSV** = one row per `Field` (`requirement, field name, label.en, value`). `store.exportAs(format)` calls this; you return the Blob, the store triggers download. (DOCX is a stretch — stub it to throw a friendly "coming soon" and move on.)

- [ ] 8. **Eval harness** (`scripts/eval.mjs`, NEW — `npm run eval` or `node scripts/eval.mjs`). POST each sample doc in `scripts/samples/` to `http://localhost:3000/api/analyze` and print a table: `{ doc, requirements_found, flags_found, fill_field_groups, grouping_ok?, latency_ms }`. `grouping_ok` = did street+city+state+zip collapse into ONE `fill-field` requirement? Pure Node `fetch`, zero deps. This is your regression net — run it after every prompt change so we catch drift before the judges do.

- [ ] 9. **Multiple doc classes** (`lib/prompt.ts` + `lib/mock.ts`). The SBA loan app is the hero, but prove generality: add 2–3 more sample classes to the prompt's few-shots + a small mock for each — e.g. a **lease/rental agreement** (deadlines, signatures, fees), a **government benefits renewal** (gather-document prerequisites + a hard deadline), an **immigration/USCIS form** (external background actions). Each must surface the right `RequirementType` mix + `topFlags`. Don't bloat the hero mock — keep these as separate small exports the eval can target.

- [ ] 10. **Model benchmark: 2.5-flash vs -pro** (extend `scripts/eval.mjs`). Run the same sample set against `gemini-2.5-flash` and `gemini-2.5-pro` (model via a `GEMINI_MODEL` env or a CLI flag Preston exposes in `lib/ai.ts` — coordinate, don't edit his file). Print accuracy (requirements/flags found vs. a hand-checked expected) AND latency per model. Pick the fastest that stays accurate as the demo default; report the numbers so we can justify the choice to judges.

- [ ] 11. **Bilingual integrity pass** (`lib/extract.ts` normalizer + `lib/prompt.ts`). Guarantee EVERY `Record<Lang,string>` has a real `es` — if the model returns only `en`, the normalizer must fill `es` (translate-on-miss or at minimum copy + flag) so the ES toggle never shows blanks. Spot-check the SBA mock and one live run end-to-end in Spanish. This carries the old app's accessibility strength — it's a judging criterion, not a nicety.

- [ ] 12. **Reliability + edge cases** (`lib/extract.ts`, `lib/chat.ts`, `lib/export.ts`). Confirm graceful failure on: a garbage/blurry image, a malformed model reply (extra keys, missing arrays, out-of-range rects), a PDF with NO AcroForm (export should still emit JSON/CSV + a flattened copy, not throw), and a chat question the doc can't answer. Every path returns a friendly result, never a crash. If you find a gap that lives in Preston's normalization seam (`lib/ai.ts`/`app/api/*`), flag him — don't reach in.

- [ ] 13. **Few-shot tightening + grouping benchmark** (`lib/prompt.ts`, `scripts/eval.mjs`). Now that the harness scores grouping, tune the few-shots until the SBA address block reliably collapses to ONE spotlight and prerequisites consistently order before on-page fills across all doc classes. Re-run the eval; lock the prompt version that scores best. Record before/after grouping accuracy in your commit message so the win is visible.

- [ ] 14. **Final live QA + DOCX stretch** (all your files). Run every sample doc through the LIVE flow (`upload → /api/analyze → checklist + canvas tour + chat + export`) and log anything off for Preston. If time remains, land **DOCX** export in `lib/export.ts` (a minimal `docx`-package or hand-rolled OOXML — your call, keep it dependency-light) so EXPORT shows all four formats on stage. If it risks the build, leave the friendly stub and move on — protect the demo.
