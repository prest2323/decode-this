# 🔁 SAWYER'S PHASE-1 QUEUE — Frontend: the Document Canvas + Spotlight + Look & Feel

> You own the visual document surface — the thing judges actually look at. Render real pages with **pdfjs-dist**, stack an overlay layer of editable inputs on top (positioned by NORMALIZED rects), and dim everything except the active requirement with an SVG **Spotlight**. **Pull the new `main` first** (`git pull origin main`) — the template is brand new; your four files ship as compiling stubs and your job is to make them REAL and beautiful. **You're on Antigravity / Gemini**, so this queue is extra prescriptive: exact file, exact prop, exact Tailwind classes, exact fetch shape. Don't improvise structure — follow the steps.
>
> **THE CONTRACT (Preston owns `lib/types.ts` — do NOT edit it):** the atomic unit is a **`Requirement`**, not a field. A `Requirement` has `fields: Field[]` and a `spotlight: Rect | null`. A `Field` has a `rect: Rect`. A `Rect` is `{ page, x, y, w, h }` **NORMALIZED to [0..1], origin top-left** — so `left = x*100%`, `top = y*100%`, `width = w*100%`, `height = h*100%` of the page box, and it lines up at ANY zoom. A `DocPage` has `{ index, image, width, height }`. Everything bilingual: text is `Record<Lang,string>` — read the right language with `label[lang]`.
>
> **THE STORE (Preston owns `lib/store.ts` — do NOT edit it):** every component is a client component that calls `useDoc()` and gets:
> `doc: DocumentModel | null`, `lang: "en"|"es"`, `activeIndex: number`, `active: Requirement | null`,
> `loadDoc(doc)`, `setLang(l)`, `goTo(i)`, `next()`, `prev()`, `setFieldValue(fieldId, value)`, `setStatus(reqId, status)`, `exportAs(format)`.
> You read `doc.pages`, `active.spotlight`, `active.fields`, `lang` from it. You call `setFieldValue` and `loadDoc`. Minimal prop threading — pull from the store, don't invent props.

## You own (edit ONLY these)
`components/DocCanvas.tsx`, `components/FieldOverlay.tsx`, `components/Spotlight.tsx`, `components/Uploader.tsx`, `app/globals.css`
(plus: drop the pdf worker file into `public/pdf.worker.min.mjs` — see Task 1.)

## Do NOT edit (other people's files — coordinate in chat if you think you need a change)
`lib/types.ts`, `lib/store.ts`, `lib/ai.ts`, `app/api/**`, `app/page.tsx` (Preston) · `lib/mock.ts`, `lib/extract.ts`, `lib/chat.ts`, `lib/export.ts`, `lib/prompt.ts`, `scripts/eval.mjs` (Michael) · `components/ChecklistPanel.tsx`, `components/GuideBox.tsx`, `components/TourController.tsx`, `components/ChatWidget.tsx`, `components/RiskSummary.tsx` (Aiden). **Never touch `lib/types.ts` — that's the shared contract; route any type change through Preston.**

## The loop (never sit idle)
1. `git checkout -b phase1-sawyer` off the fresh `main` (do this once).
2. Do the **first unchecked `[ ]`** task below — ONLY in your files.
3. Test: `npm run dev`, open `http://localhost:3000`. It must compile and the mock SBA doc must still render. No API key needed — `/api/analyze` returns the mock.
4. Mark it `[x]` → `git add` ONLY your files (e.g. `git add components/DocCanvas.tsx app/globals.css`) → commit small → `git push origin phase1-sawyer`.
5. Ping Preston: **"✅ Done: <task>"**. Then start the next. When all `[x]`: **"🟢 Queue empty."**
> Never push to `main`. Never force-push. Never `git add -A` or `git add .` blindly. Never commit `.env.local` or `node_modules`. Keep the demo green.

## The queue (priority order — demo-critical first)

- [x] 1. **🔴 INSTALL + WORKER FIRST — make pdfjs-dist run on Next 16.** This unblocks everything. From the repo root:
  ```bash
  npm i pdfjs-dist
  ```
  Then copy the worker into `public/` so the browser can fetch it (the version MUST match the package, so copy from node_modules, don't hardcode a CDN):
  ```bash
  # PowerShell
  Copy-Item node_modules/pdfjs-dist/build/pdf.worker.min.mjs public/pdf.worker.min.mjs
  ```
  In **`components/DocCanvas.tsx`** add `"use client";` at the very top and configure the worker ONCE at module scope (current pdfjs-dist 5.x API):
  ```ts
  "use client";
  import * as pdfjsLib from "pdfjs-dist";
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  ```
  Sanity check: `console.log(pdfjsLib.version)` — if you ever see a "fake worker" warning or blank canvas, the `public/pdf.worker.min.mjs` is missing or the wrong version. Re-copy it.

- [x] 2. **🔴 DocCanvas renders the page image + the overlay layer.** In **`components/DocCanvas.tsx`**, read from `useDoc()`: `const { doc, active, lang } = useDoc();`. For Phase 1 the mock pages are **raster images** (`DocPage.image` is a data-URL / path) — render those first; PDF-from-pdfjs is Task 3. Structure:
  ```tsx
  // outer: the scroll/zoom area
  <div className="relative mx-auto w-full max-w-3xl">
    {doc?.pages.map((p) => (
      // PAGE BOX — this is the positioning context. position:relative so % children align.
      <div key={p.index}
           className="relative mb-6 w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-white"
           style={{ aspectRatio: `${p.width} / ${p.height}` }}>
        <img src={p.image} alt="" className="block h-full w-full select-none" draggable={false} />
        {/* OVERLAY LAYER — absolutely fills the page box; children positioned in % */}
        <div className="pointer-events-none absolute inset-0">
          {/* Spotlight + FieldOverlays go here (Tasks 4 & 5) */}
        </div>
      </div>
    ))}
  </div>
  ```
  **The golden rule:** the PAGE BOX is `relative`, the overlay is `absolute inset-0`, and every child positions in **percent** of that box. `aspectRatio: width/height` keeps the box matching the document so normalized rects always line up. Test: the mock SBA pages show up stacked and centered.

- [x] 3. **Real PDF rendering with pdfjs-dist (so uploaded PDFs work, not just mock rasters).** In **`components/DocCanvas.tsx`**, add a `<canvas>` render path for when a page has no pre-rendered `image`. Verified current render snippet (works on pdfjs-dist 5.x, Next 16 client component):
  ```ts
  const loadingTask = pdfjsLib.getDocument({ url }); // or { data: uint8array }
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageNumber); // 1-based
  const scale = 2; // crisp on HiDPI
  const viewport = page.getViewport({ scale });
  const canvas = canvasRef.current!;
  const context = canvas.getContext("2d")!;
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  await page.render({ canvasContext: context, viewport }).promise;
  ```
  Do it in a `useEffect` (client-only). The `<canvas>` sits where the `<img>` was, same `relative` page box, same `aspectRatio` from `viewport.width/height`. Keep the overlay layer identical — overlays don't care whether the page is an `<img>` or a `<canvas>`. Don't block the demo on this; the mock raster path (Task 2) must keep working.

- [x] 4. **🔴 FieldOverlay — an editable input positioned by normalized rect.** This is the "type directly into the document" magic. Create **`components/FieldOverlay.tsx`** (`"use client"`). It takes ONE `Field` and positions itself in the overlay layer:
  ```tsx
  export default function FieldOverlay({ field }: { field: Field }) {
    const { lang, setFieldValue } = useDoc();
    const { x, y, w, h } = field.rect;
    const style = {
      left: `${x * 100}%`, top: `${y * 100}%`,
      width: `${w * 100}%`, height: `${h * 100}%`,
    } as const;
    return (
      <input
        aria-label={field.label[lang]}
        placeholder={field.placeholder ?? field.label[lang]}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={(e) => setFieldValue(field.id, e.target.value)}
        className="pointer-events-auto absolute rounded-md border border-sky-400/60 bg-sky-50/80 px-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-300"
        style={style}
      />
    );
  }
  ```
  Notes: the overlay layer is `pointer-events-none`, so each input MUST be `pointer-events-auto` to be clickable. Handle the field kinds: `checkbox`/`radio` → render an `<input type=...>`; `date` → `type="date"`; `signature` → a styled box; everything else → `type="text"`. In **`DocCanvas.tsx`**, render `doc.requirements.flatMap(r => r.fields).filter(f => f.rect.page === p.index).map(f => <FieldOverlay key={f.id} field={f} />)` inside the overlay layer. Test: you can click a field on the SBA mock and type, and the value persists (it's going through `setFieldValue` → store).

- [x] 5. **🔴 Spotlight — SVG dim with a cut-out hole over `active.spotlight`.** Create **`components/Spotlight.tsx`** (`"use client"`). It reads `active` from the store and dims the WHOLE page except the active requirement's `spotlight` rect. Use an SVG `<mask>`: a full white rect (show) minus a black rect (the hole) — the dim overlay is painted everywhere the mask is white. Coordinates are in a 0..100 viewBox so they map directly from normalized rects:
  ```tsx
  export default function Spotlight() {
    const { active } = useDoc();
    const s = active?.spotlight;
    if (!s) return null;
    return (
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
           className="pointer-events-none absolute inset-0 h-full w-full">
        <defs>
          <mask id="hole">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <rect x={s.x*100} y={s.y*100} width={s.w*100} height={s.h*100}
                  rx="1" fill="black"
                  style={{ transition: "all 350ms cubic-bezier(0.4,0,0.2,1)" }} />
          </mask>
        </defs>
        <rect x="0" y="0" width="100" height="100"
              fill="rgba(15,23,42,0.55)" mask="url(#hole)" />
      </svg>
    );
  }
  ```
  Put `<Spotlight />` as the FIRST child of the overlay layer (so it sits UNDER the FieldOverlays — the dim must not cover the inputs you're editing). The `transition: all` on the hole rect gives a smooth animated glide between steps when `goTo`/`next` changes `active`. Only render the spotlight on the page where `s.page === p.index` (gate it). Test: stepping through requirements moves a smooth lit window around the SBA doc; the rest is dimmed; the focused fields stay bright and editable.

- [x] 6. **Spotlight polish — a glowing ring + clamp the hole inside the page.** In **`components/Spotlight.tsx`**, add a stroked `<rect>` (same x/y/w/h, `fill="none" stroke="#38bdf8" strokeWidth="0.4"` with the same transition) drawn AFTER the dim so the lit window has a crisp sky-blue border. Clamp so a slightly off-spec rect from the model never paints off-page: `const cx = Math.max(0, Math.min(1, s.x))` etc. (defensive — an off-spec model reply must never break the visual). Keep it `pointer-events-none`.

- [x] 7. **🔴 Uploader — polished drag/drop for PDF + image, POSTs to `/api/analyze`.** Rewrite **`components/Uploader.tsx`** (`"use client"`). Accept `accept="application/pdf,image/*"`. On drop or pick: read the file to a base64 data-URL, show a thumbnail, and POST the EXACT `AnalyzeRequest` shape, then `loadDoc` the result:
  ```tsx
  const { loadDoc } = useDoc();
  async function analyze(file: File) {
    const file64 = await new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(r.result as string); r.readAsDataURL(file);
    });
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, file: file64, mime: file.type }), // AnalyzeRequest
    });
    const data = await res.json(); // ApiResponse<DocumentModel>
    if (data.ok) loadDoc(data.result); else setError(data.error);
  }
  ```
  Drag/drop UI: a big dashed dropzone `className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center transition-colors"`, and on `onDragOver` (call `e.preventDefault()`) swap to `border-sky-400 bg-sky-50`. Handle `onDrop` (`e.preventDefault()`, read `e.dataTransfer.files[0]`) AND a hidden `<input type="file">` fallback button. Show a `loading` spinner state while the fetch is in flight and `reader.onerror` → a friendly inline message. Test: dropping the sample SBA PDF triggers analyze and the canvas fills with the returned doc. With no API key it returns the mock — still works.

- [x] 8. **🔴 globals.css — the theme (Tailwind v4, light, calm, legible).** Own **`app/globals.css`**. Tailwind v4 is config-less — define the design system in CSS with `@theme`. Verified v4 setup:
  ```css
  @import "tailwindcss";

  @theme {
    --color-bg: #f8fafc;          /* slate-50 page */
    --color-surface: #ffffff;
    --color-ink: #0f172a;         /* slate-900 text */
    --color-muted: #64748b;       /* slate-500 */
    --color-brand: #0284c7;       /* sky-600 — accent/spotlight */
    --color-brand-soft: #e0f2fe;  /* sky-100 */
    --color-danger: #dc2626;      /* deadlines/fees */
    --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
    --radius-lg: 1rem;
  }

  html, body { background: var(--color-bg); color: var(--color-ink); }
  body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
  ```
  Now you have utilities like `bg-bg`, `text-ink`, `text-muted`, `bg-brand`, `text-brand`, `bg-brand-soft` everywhere. Keep it LIGHT, high-contrast, lots of whitespace — accessibility matters (this app helps stressed people read scary documents). Don't add a dark mode in Phase 1.

- [x] 9. **Zoom + fit controls on the canvas.** In **`components/DocCanvas.tsx`**, add a small toolbar (zoom −/+/fit) that scales the page box via a `transform: scale()` or by adjusting `max-w`. Because rects are PERCENT-based, overlays and spotlight stay aligned at any zoom for free — verify that by zooming in and confirming a FieldOverlay still sits exactly on its box. Buttons: `className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-ink hover:bg-slate-50"`.

- [x] 10. **Active-requirement visual emphasis on its fields.** In **`components/FieldOverlay.tsx`**, accept the active state from the store (`const { active } = useDoc()`) and, when `field` belongs to `active` (`active?.fields.some(f => f.id === field.id)`), add a brighter ring: `ring-2 ring-brand` and `bg-brand-soft`. Fields NOT in the active requirement render dimmer (`opacity-70`). This makes the spotlit group obviously "the thing to fill now."

- [x] 11. **Auto-scroll to the active spotlight on step change.** In **`components/DocCanvas.tsx`**, `useEffect` on `active?.id` → `ref.current?.scrollIntoView({ behavior: "smooth", block: "center" })` on the active page box (or the spotlight wrapper). When `next()`/`prev()` fires, the canvas glides to the lit region so the user never has to hunt for it. Keep it gentle; respect `prefers-reduced-motion` (skip the smooth behavior if set).

- [x] 12. **Field-kind coverage + empty/loading states.** In **`components/FieldOverlay.tsx`**, finish all `Field.kind` cases: `checkbox`/`radio` (use `field.options` for radio groups, value via `setFieldValue`), `date` (`type="date"`), `signature` (a tap-to-sign box styled `italic text-muted`). In **`components/DocCanvas.tsx`**, when `doc === null` show a calm centered empty state pointing at the Uploader ("Drop a document to begin"), and a skeleton shimmer while analyzing. No raw nulls, no layout jump.

- [x] 13. **Accessibility + responsive pass.** Every FieldOverlay has an `aria-label` from `field.label[lang]`. The Spotlight SVG is `aria-hidden`. Tab order should walk fields top-to-bottom (DOM order = rect order is fine for the demo). On narrow screens the canvas `max-w` shrinks and the toolbar wraps. Verify keyboard-only: you can Tab into a field and type. High contrast on the dim (`rgba(15,23,42,0.55)`) keeps lit text readable.

- [x] 14. **Final visual polish for the demo.** Soft shadows on page boxes, a subtle page-turn/fade when `activeIndex` changes, a smooth 350ms spotlight glide (already in Task 5 — confirm it feels good), and consistent spacing. Run through the full SBA flow on `npm run dev`: upload → canvas renders → spotlight tours the requirements → you type into grouped fields → it looks calm and trustworthy from across the room. Ping Preston when the surface is demo-ready.
