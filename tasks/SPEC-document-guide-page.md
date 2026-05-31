# SPEC — Document Guide page (front-end / Workspace redesign)

**For:** Preston (Lead) — you own `app/page.tsx` (the Workspace) and `lib/store.tsx`.
**Requested by:** Sawyer (front-end / canvas).
**Build on:** your own branch (`phase1-preston`). Never commit to `main`. Keep the SBA **mock demo green** the whole time.

---

## Goal
Turn the loaded-document Workspace into a focused **Document Guide**: the document goes **near-fullscreen**, with a slim **top nav bar** and a **2-tab strip** just under it that switches between the document and an organized **Overview** of all the extracted data — so the analysis and the document never fight for the same screen.

---

## Where this lives (ownership)
- **`app/page.tsx` (you)** — the nav bar, the tab strip, the view-mode state, and which view renders. ~90% of this task.
- **`lib/store.tsx` (you)** — only if you decide the view-mode should be shared state (local `useState` is fine; see §1).
- **Reused as-is (do NOT edit their internals — consume via their existing props / `useDoc()`):**
  - `RiskSummary` + `ChecklistPanel` (Aiden) → the Overview content.
  - `DocCanvas` + `TourController` (Sawyer / Aiden) → the document view.
  - `ChatWidget` (Aiden) → the chat.
- **Cross-lane coordination flags** are listed at the bottom (Chat button ↔ ChatWidget, DocCanvas width).

---

## Current state you're changing
`app/page.tsx`, when `doc` is loaded, renders: a header (`← New`, docType, LangToggle, export PDF/JSON/CSV) + a 2-column grid — left sidebar = `RiskSummary` + `ChecklistPanel`, center = `DocCanvas` + `TourController` — plus a floating `ChatWidget`. **We replace the 2-column grid with a nav + tab + single-view layout.** The no-doc upload hero stays as-is.

---

## The build

### 1. View-mode state
```ts
const [view, setView] = useState<"guide" | "overview">("guide");
```
Local state in `page.tsx` is enough — it's a pure view toggle. Only lift into `lib/store.tsx` if another component needs to read it.

### 2. Top nav bar (replaces today's header)
A slim, full-width bar — `border-b border-line bg-surface`, comfortable padding. Left → right:
- **🏠 Home** — calls `reset()` from `useDoc()` → back to the upload hero. (Replaces today's `← New`.)
- **Center** — `doc.docType[lang]` (bold) + `doc.fileName` (muted), or an app wordmark. Your call.
- **Right cluster** — the existing **LangToggle**, the **export** buttons (PDF / JSON / CSV), and a **💬 Chat** button (see coordination note — minimal path: it opens `ChatWidget`).

> The user listed "Overview / Chat / Home" for the nav. **Home + Chat** are nav-bar buttons; **Overview** is realized as a tab (§3) — that's the same Overview, sitting in the tab strip directly under the nav. If you'd also like an Overview button in the nav, it just calls `setView("overview")`.

### 3. The 2-tab strip (hovering just under the nav)
Two tabs in a pill container with a small gap/shadow below the nav. Order: **Document Guide** (left), **Overview** (right).
- **Tab A — Document Guide:** emoji **📄** + label `"Document Guide"` / ES `"Guía del documento"`. Selects `view = "guide"`.
- **Tab B — Overview:** emoji **🗂️** (suggestion) + label `"Overview"` / ES `"Resumen"`. Selects `view = "overview"`.

**The distinctive interaction (build this carefully — it's the point):**
- **Active tab** → highlighted (brand fill/ring — sky; `bg-brand text-white` or `bg-brand-soft ring-2 ring-brand`) and shows its **emoji/logo**.
- **Inactive tab** → muted/grey (`text-muted`), and instead of its emoji it shows a small **up-arrow / chevron** affordance (meaning "tap to switch up to this view"). On hover and when it becomes active, the **arrow morphs into the emoji**.
- Concretely, per the request: on the document view, **📄 Document Guide** is lit and **Overview** shows the ▲ arrow. Click Overview → the document view recedes/greys, **Overview** lights up and its ▲ becomes **🗂️**, and **Document Guide** goes grey with its 📄 becoming a ▲.
- **Morph hint:** `{isActive ? <span>{emoji}</span> : <span>▲</span>}` with a `transition` (200–300ms; opacity/scale crossfade reads nicely). Respect `prefers-reduced-motion`. Keep it smooth, not janky.

### 4. The two views (main area, fills the rest of the screen: `flex-1 min-h-0`)
- **`view === "guide"`** → `<DocCanvas />` filling the area (near-fullscreen) with `<TourController />` docked at the bottom. The document is the star.
- **`view === "overview"`** → the **Overview**: an organized, user-friendly, scrollable layout of all the clustered data, in a centered `max-w` container with generous whitespace (readable across a room):
  - `<RiskSummary />` (Protect summary + flag chips) up top.
  - `<ChecklistPanel />` (every requirement as a step) below — or a 2-column split on wide screens.
  - The document is **not** rendered here, so it can't get in the way.
- **"Document goes back to grey":** simplest faithful reading = the **Document Guide tab** goes inactive/grey while Overview is up (the doc view just isn't rendered). If you want the literal "dimmed document behind the overview" effect, render `DocCanvas` under a `bg-slate-900/40` scrim — optional polish, don't block on it.

### 5. Near-fullscreen document
- Drop the `lg:grid-cols-[320px_1fr]` sidebar — the main area is full-width now (the sidebar's content moved into Overview).
- `DocCanvas` currently caps its page at `max-w-[640px]` (Sawyer's file). For "almost full screen" that cap should grow / fit-to-height — **that's a Sawyer change**, coordinate (Sawyer can do it on the canvas branch).

---

## Acceptance criteria
- [ ] Loaded-doc Workspace = **nav bar** (🏠 Home · title · LangToggle · export · 💬 Chat) → **tab strip** (📄 Document Guide | 🗂️ Overview) → **near-fullscreen** main view.
- [ ] Default view = Document Guide; the document is near-fullscreen and the tour works.
- [ ] Clicking **Overview** swaps to the organized data view (RiskSummary + Checklist); the doc isn't in the way; the active tab is highlighted with its emoji, the inactive tab shows the ▲ arrow that morphs to the emoji on activation.
- [ ] **Home** → upload hero (`reset()`). **Chat** → opens ChatWidget.
- [ ] Bilingual EN/ES throughout · light theme · mock demo stays green · `npx tsc --noEmit` passes.

---

## Coordination (cross-lane — your calls as Lead)
- **Chat button ↔ ChatWidget:** `ChatWidget` (Aiden) owns its `open` state internally. For a nav Chat button to open it, ChatWidget needs a controlled `open` / `onOpenChange` prop (small Aiden change). **Minimal path now:** keep ChatWidget's existing floating button; add the nav Chat button once Aiden exposes a prop. Ping Aiden.
- **DocCanvas width:** Sawyer owns `DocCanvas`; the near-fullscreen sizing tweak (raise/replace `max-w-[640px]`) is Sawyer's. Coordinate so the doc actually fills the wider area.
- **Store:** if chat/tour should react to the view-mode, add it to `lib/store.tsx` (yours); otherwise local `useState` is fine.

## Constraints (AGENTS.md)
- Only edit **your** files (`app/page.tsx`, and `lib/store.tsx` if needed). Reuse others' components via their existing props / `useDoc()` — don't touch their internals.
- Next 16 / React 19 / Tailwind v4 — verify current APIs; don't trust stale snippets.
- Do **not** change the contract (`lib/types.ts`).
- Theme tokens available from `app/globals.css`: `bg-surface`, `text-ink`, `text-muted`, `border-line`, `bg-brand`, `bg-brand-soft`, `ring-brand`, `text-danger`.
