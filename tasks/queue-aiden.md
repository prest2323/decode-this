# 🔁 AIDEN'S PHASE-1 QUEUE — Frontend / Guidance UX + Demo + Pitch

> We pivoted. "Decode This" is now a **guided document-walkthrough platform** — drop in a scary doc (hero = an **SBA 7(a) small-business loan application**) and the AI gives a plain summary + traps (PROTECT), an interactive checklist (CHECKLIST), an on-document spotlight tour (GUIDED), a grounded chat, and export. **You own the hand-holding UX** — the checklist, the floating guide box, the tour controls, the chat widget, the Protect view — plus the demo and the pitch.
>
> **Pull the new main FIRST:** `git pull origin main` then `git checkout -b phase1-aiden`. The old branches are dead. The template already **builds and runs on mock** (no API key needed) — your job is to make YOUR stubs real, not rebuild the app.
>
> **You are on Antigravity / Gemini.** This queue is extra explicit on purpose — exact files, exact props, exact Tailwind classes, exact fetch shapes. Follow them literally.
>
> **Contract reminder (owned by Preston — do NOT change `lib/types.ts`):** the atomic unit is a **`Requirement`**, not a field. The same `Requirement[]` powers all three views. A `Requirement` has `{ id, order, type, difficulty, status, title: {en,es}, guidance: {en,es}, flags: Flag[], fields: Field[], spotlight: Rect | null }`. A `Rect` is **normalized `{ page, x, y, w, h }` in `[0..1]`, origin top-left**. A `Flag` is `{ kind, label: {en,es}, date? }` where `kind` ∈ `"deadline"|"fee"|"background-check"|"legal-risk"|"scam"|"tip"`. Every user-facing string is `Record<Lang,string>` (`Lang = "en"|"es"`) — render `label[lang]`, never a bare string.

## You own (edit ONLY these)
- `components/ChecklistPanel.tsx`
- `components/GuideBox.tsx`
- `components/TourController.tsx`
- `components/ChatWidget.tsx`
- `components/RiskSummary.tsx`
- `demo/` (demo script + assets)
- `PITCH.md`

## Do NOT edit (other people's files — coordinate in chat)
- `lib/types.ts` (the contract — **Preston only**), `lib/store.ts`, `lib/ai.ts`, `lib/mock.ts`, `lib/extract.ts`, `lib/chat.ts`, `lib/export.ts`, `lib/prompt.ts` (Preston/Michael)
- `app/page.tsx`, `app/api/*` (Preston) — the Workspace layout already mounts your components
- `components/DocCanvas.tsx`, `components/FieldOverlay.tsx`, `components/Spotlight.tsx`, `components/Uploader.tsx`, `app/globals.css` (Sawyer)
> If a task seems to need a change outside your files (especially the contract), **STOP and ping Preston** — don't reach into someone else's file.

## The store API — everything reads `useDoc()` (from `lib/store.ts`)
Every one of your components is a **client component** (`"use client"` at the top of the file) and gets ALL its data from the hook — almost no prop threading:
```ts
const {
  doc,            // DocumentModel | null
  lang,           // "en" | "es"
  activeIndex,    // number — index into doc.requirements
  active,         // Requirement | null  (== doc.requirements[activeIndex])
  loadDoc,        // (doc: DocumentModel) => void
  setLang,        // (l: Lang) => void
  goTo,           // (i: number) => void
  next, prev,     // () => void   (clamp at ends)
  setFieldValue,  // (fieldId: string, value: string|boolean|null) => void
  setStatus,      // (reqId: string, status: ReqStatus) => void  ("todo"|"active"|"done")
  exportAs,       // (format: "pdf"|"json"|"csv"|"docx") => void
} = useDoc();
```
**Always guard `doc`/`active` for null** (`if (!doc) return null;`) so a pre-upload render never crashes.

## The loop (never sit idle)
1. Do the first unchecked `[ ]` task — ONLY in the files you own.
2. Test: `npm run dev`, open `http://localhost:3000`, upload the SBA mock (or it auto-loads mock with no key), and click through your view.
3. Mark it `[x]` → `git add <only your files>` → small commit → `git push origin phase1-aiden`.
4. Ping Preston **"✅ Done: <task>"** then start the next. When all `[x]`: **"🟢 Queue empty."**
> Never push to `main`, never force-push, never `git add -A` blindly, never commit `.env.local` or `node_modules`. Build against mock — you never wait on the backend.

## The queue (priority order — demo-critical first)

- [ ] 1. **🔴 RiskSummary — the PROTECT view (first thing judges see).** In `components/RiskSummary.tsx` (`"use client"`), read `const { doc, lang } = useDoc();`, guard `if (!doc) return null;`. Render:
  - a heading: `doc.docType[lang]` (e.g. "SBA 7(a) Loan Application"),
  - the 3-sentence plain summary: `doc.summary[lang]` in a calm card (`className="rounded-xl bg-white/80 p-5 text-base leading-relaxed text-slate-700"`),
  - then map `doc.topFlags` to colored **flag chips** (reuse the chip in task 2). Sort traps first: deadline/fee/legal-risk/background-check/scam before tip.
  Layout the chips with `className="flex flex-wrap gap-2"`. This is the "we protect you" moment — make it legible from across a room.

- [ ] 2. **🔴 Flag chip helper (used by RiskSummary + ChecklistPanel).** Inside `components/RiskSummary.tsx`, export a small `FlagChip` component: `export function FlagChip({ flag, lang }: { flag: Flag; lang: Lang }) {...}`. Import `Flag`, `Lang` from `"@/lib/types"`. Map `flag.kind` → an emoji + Tailwind color, render `flag.label[lang]` (and `flag.date` if present). Use these exact classes per kind so colors are consistent everywhere:
  ```tsx
  const STYLE: Record<FlagKind, {icon: string; cls: string}> = {
    deadline:           { icon: "⏰", cls: "bg-red-100 text-red-800 ring-red-200" },
    fee:                { icon: "💸", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
    "legal-risk":       { icon: "⚖️", cls: "bg-purple-100 text-purple-800 ring-purple-200" },
    "background-check": { icon: "🔎", cls: "bg-blue-100 text-blue-800 ring-blue-200" },
    scam:               { icon: "🚩", cls: "bg-rose-100 text-rose-900 ring-rose-300" },
    tip:                { icon: "💡", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  };
  // chip: className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ring-1 ${STYLE[flag.kind].cls}`}
  ```
  (`FlagKind` is in `lib/types.ts` — import it.) Show date as ` · ${flag.date}` when `flag.date` is truthy.

- [ ] 3. **🔴 ChecklistPanel — the requirement list (the spine of the UI).** In `components/ChecklistPanel.tsx` (`"use client"`), `const { doc, lang, activeIndex, goTo, setStatus } = useDoc();`, guard null. Map `doc.requirements` (already ordered by `order`) to clickable rows. Each row:
  - a **type icon** by `req.type`: `"fill-field"`→✏️, `"gather-document"`→📄, `"external-action"`→🌐, `"sign"`→🖊️, `"pay-fee"`→💳,
  - the title `req.title[lang]`,
  - **flag chips** for `req.flags` (reuse `FlagChip` from task 2 — small),
  - a **status control**: a checkbox/toggle that calls `setStatus(req.id, req.status === "done" ? "todo" : "done")`.
  - Clicking the row body calls `goTo(index)`. Highlight the active row when `index === activeIndex` (`className` includes `ring-2 ring-indigo-500 bg-indigo-50`). Make the row a real `<button>` for keyboard focus.
  Done rows get `line-through text-slate-400 opacity-70`. Add a top counter: `{done}/{total} steps done`.

- [ ] 4. **🔴 GuideBox — the floating guide card with COLLISION-FREE placement (the user explicitly demanded this).** In `components/GuideBox.tsx` (`"use client"`), `const { active, lang, next, prev, setStatus, activeIndex, doc } = useDoc();`, guard `if (!active) return null;`. The card shows: `active.title[lang]` (bold), `active.guidance[lang]` (plain text), this requirement's flag chips, and a button row: **Back** (`prev`), **Mark done** (`setStatus(active.id, "done")` then `next()`), **Next** (`next`). Then place it in the **largest free quadrant relative to `active.spotlight`** so it NEVER covers the focused field:
  - The GuideBox is rendered **inside the same positioned container as DocCanvas/Spotlight** (Preston's layout passes you the canvas size, OR you read it from a `ref` on the wrapper). Convert the normalized spotlight rect to pixels: `sx = spot.x*W, sy = spot.y*H, sw = spot.w*W, sh = spot.h*H` where `W,H` are the rendered canvas px size.
  - Compute free space on each side of the spotlight and drop the card into the side with the most room. Verified placement math (pure geometry, no lib):
    ```ts
    // GUIDE_W/H ≈ your card size, e.g. 320 x 180
    const space = {
      right:  W - (sx + sw),
      left:   sx,
      bottom: H - (sy + sh),
      top:    sy,
    };
    // pick the side with the most room that fits the card
    const order = (["right","left","bottom","top"] as const)
      .sort((a, b) => space[b] - space[a]);
    let pos = { left: 0, top: 0 };
    for (const side of order) {
      if (side === "right" && space.right >= GUIDE_W) { pos = { left: sx + sw + 16, top: clampTop(sy) }; break; }
      if (side === "left"  && space.left  >= GUIDE_W) { pos = { left: sx - GUIDE_W - 16, top: clampTop(sy) }; break; }
      if (side === "bottom"&& space.bottom>= GUIDE_H) { pos = { left: clampLeft(sx), top: sy + sh + 16 }; break; }
      if (side === "top"   && space.top   >= GUIDE_H) { pos = { left: clampLeft(sx), top: sy - GUIDE_H - 16 }; break; }
    }
    // clamp so the card stays fully on-canvas
    const clampTop  = (t: number) => Math.max(8, Math.min(t, H - GUIDE_H - 8));
    const clampLeft = (l: number) => Math.max(8, Math.min(l, W - GUIDE_W - 8));
    ```
  - Apply with `style={{ position: "absolute", left: pos.left, top: pos.top, width: GUIDE_W }}` and `className="z-30 rounded-xl bg-white p-4 shadow-2xl ring-1 ring-slate-200"`. Recompute in a `useMemo` keyed on `[active?.id, W, H]`. If `active.spotlight` is null (a `gather-document`/`external-action` step with no on-page field), center the card instead.

- [ ] 5. **🔴 TourController — step nav + progress bar + keyboard arrows.** In `components/TourController.tsx` (`"use client"`), `const { doc, activeIndex, next, prev, goTo } = useDoc();`, guard null. Render:
  - **Prev / Next buttons** wired to `prev()`/`next()` (disable Prev at `activeIndex===0`, Next at `activeIndex===doc.requirements.length-1`),
  - `Step {activeIndex+1} of {doc.requirements.length}`,
  - an **accessible progress bar** (verified ARIA pattern — use a native `<progress>` OR `role="progressbar"`):
    ```tsx
    const total = doc.requirements.length;
    const value = activeIndex + 1;
    <div role="progressbar" aria-valuenow={value} aria-valuemin={1} aria-valuemax={total}
         aria-label="Walkthrough progress"
         className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full bg-indigo-500 transition-all"
           style={{ width: `${(value/total)*100}%` }} />
    </div>
    ```
  - **Keyboard arrows** drive the tour. React 19 verified pattern — `useEffect` with a `window` `keydown` listener and a cleanup return (never `async` on the effect itself):
    ```tsx
    useEffect(() => {
      const onKey = (e: KeyboardEvent) => {
        const t = e.target as HTMLElement;
        if (t.tagName === "INPUT" || t.tagName === "TEXTAREA") return; // don't hijack typing
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft")  prev();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [next, prev]);
    ```

- [ ] 6. **🟠 ChatWidget — docked, context-aware chat grounded in the doc + current step.** In `components/ChatWidget.tsx` (`"use client"`), `const { doc, lang, active } = useDoc();`. Local state: `const [msgs, setMsgs] = useState<{role:"user"|"ai"; text:string}[]>([])`, `const [q, setQ] = useState("")`, `const [busy, setBusy] = useState(false)`. On send, POST to `/api/chat` (React 19 verified: async function called from the click/submit handler). **Exact fetch shape — body matches `ChatRequest`, response is `ApiResponse<ChatResult>`:**
  ```ts
  async function send() {
    if (!q.trim() || !doc) return;
    const question = q.trim();
    setMsgs(m => [...m, { role: "user", text: question }]);
    setQ(""); setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question, lang, doc,
          activeRequirementId: active?.id ?? null,
        } satisfies ChatRequest),
      });
      const data = (await res.json()) as ApiResponse<ChatResult>;
      const answer = data.ok ? data.result.answer
                             : (lang === "es" ? "Algo salió mal. Intenta de nuevo." : "Something went wrong. Try again.");
      setMsgs(m => [...m, { role: "ai", text: answer }]);
    } catch {
      setMsgs(m => [...m, { role: "ai", text: lang === "es" ? "Sin conexión." : "Connection error." }]);
    } finally { setBusy(false); }
  }
  ```
  Import `ChatRequest, ChatResult, ApiResponse` from `"@/lib/types"`. Render a scrollable message list (user right / ai left bubbles), an input + Send button (Enter submits, disabled while `busy`), and a "thinking…" indicator when `busy`. Seed one greeting bubble that names the active step so it feels grounded: `lang==="es" ? "Pregúntame sobre este paso." : "Ask me anything about this step."`

- [ ] 7. **🟠 Bilingual everywhere + the language toggle reads through.** Audit ALL five of your components: every visible string must come from `[lang]` on a `Record<Lang,string>`, and any hard-coded English UI chrome (button labels "Back"/"Next"/"Mark done"/"Send", the "Step X of Y" text, the chat greeting) must have an ES variant via a tiny local `t(en, es)` helper: `const t = (en:string, es:string) => lang === "es" ? es : en;`. Flip `setLang("es")` and confirm the whole guidance UX speaks Spanish. This is our accessibility differentiator — don't skip it.

- [ ] 8. **🟠 Empty / loading / done states.** In each component, handle the pre-upload state cleanly (`!doc` → friendly placeholder, not a blank box). In ChecklistPanel + TourController, when **all** requirements are `done`, show a celebratory "✅ You're ready to file" banner with an **Export** call-to-action that triggers `exportAs("pdf")`. This is the satisfying finish for the demo.

- [ ] 9. **🟢 demo/ — script the on-stage walkthrough.** Create `demo/SCRIPT.md`: the exact 90-second click path on the SBA mock — (1) upload → PROTECT summary + traps, (2) point at the personal-guarantee / guaranty-fee / deadline flags, (3) open CHECKLIST, click a `gather-document` step (tax return) vs an on-page `fill-field` step, (4) start the GUIDED tour, show a grouped spotlight (street+city+state+zip in ONE), type into a field, (5) ask the chat "what's the guaranty fee?", (6) Export to PDF. Note the exact buttons to click and what to say. Add `demo/CHECKLIST.md`: a pre-demo smoke test (mock loads, ES toggle works, export downloads).

- [ ] 10. **🟢 PITCH.md — rewrite around the SBA-loan hero.** Tear out the old letter-decoder pitch. New 90-second structure: **Hook** ("An SBA 7(a) loan app is 30+ pages of legal traps — a personal guarantee that puts your house on the line, a guaranty fee nobody explains, hard deadlines."). **Problem** (small-business owners give up or overpay a consultant). **Demo** (the 6 beats from task 9). **Why us** (the Requirement insight — one extraction powers protect + checklist + guided; bilingual; works offline on mock). **Ask/close.** Keep it tight and confident.

- [ ] 11. **🟢 "What we learned" + judge one-pager.** In `PITCH.md`, add 3 honest bullets (e.g. grouping fields into one spotlight, collision-free guide placement math, grounding chat without a vector DB). Then a short printable one-pager section: what the platform does + the deploy QR (get the live URL from Michael's Vercel deploy).

- [ ] 12. **🟢 Polish pass — motion + responsiveness.** Smooth the active-row highlight and the spotlight/guide-box transition (Tailwind `transition-all duration-200`). Confirm the layout doesn't break narrow: ChatWidget collapsible on small screens, ChecklistPanel scrolls (`overflow-y-auto max-h-[...]`). Keep it calm — this app reduces anxiety; the UI should feel like it too.

> **Coming next from Preston (don't block on it):** a per-field **inline hint** that the GuideBox can show when a specific `Field` is focused inside the active requirement. When the contract hook for "active field" lands, you'll wire it into `GuideBox`. He'll ping you with the shape.
