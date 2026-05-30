# 🗺️ Decode This v2 — Mock-Only Demo Roadmap (Mission Control)

**North star:** a 100% finished, demo-ready site running on **MOCK data only** — no API keys, no network in the demo. The whole story works from **"Try the sample"** (the SBA 7(a) loan application).

---

## ⏱️ Timeline (continuous integration — Preston merges as branches land)

| Window | Phase | Focus |
|---|---|---|
| **first ~2h** | **BUILD** (loop on mock) | Sawyer: beautiful canvas (spotlight + fields + theme). Aiden: Protect → Checklist → GuideBox → Tour → Chat → "ready to file" finish. Michael: real client-side export + richer mock + clean chat answers. Preston: merge every push, keep `main` green. |
| **~T-2:00** | **✅ Checkpoint 1** | Full flow merged + green on mock. |
| **~T-2:00→1:00** | **POLISH** | Visual polish, **EN/ES across the WHOLE screen**, guide box never covers the field, spotlight grouping looks right. Aiden finalizes the demo script. |
| **~T-1:00→0:30** | **DRESS REHEARSAL** | Feature freeze. Rehearse the ≤90s demo 3× on the sample. (Stretch: Vercel + QR — mock, no keys.) |
| **~T-0:30→0:00** | **🧊 HARD FREEZE** | No merges. Final rehearsal only. |

---

## ✅ IN scope vs ❌ CUT (mock-only)

**IN:** upload "Try the sample" → Protect summary + trap chips → Checklist of requirements (incl. external prereqs) → Guided spotlight tour with the **grouped address highlight** + type into fields → context chat (the "what's a personal guarantee?" beat) → Export (JSON/CSV today; PDF = a *generated* file) → bilingual EN/ES.

**CUT (do not spend the clock):** real PDF rendering of uploaded files (pdfjs-dist), real AI extraction (needs a key), filling the *original* AcroForm PDF, eval harness + model benchmark, DOCX export, a Protect/Checklist/Guided tab switcher (the app is one screen — see run-of-show), Vercel deploy unless everything else is locked.

---

## 🎯 Definition of Done (self-check — site is demo-ready when all true)
- [ ] `npm run build` green; `npm run dev` boots with **no key** (mock path).
- [ ] **PROTECT** — `RiskSummary` shows docType + 3-sentence summary + `topFlags` chips.
- [ ] **CHECKLIST** — `ChecklistPanel` lists every requirement ordered, type icon, flag chips, done/total, active highlight, click → `goTo(i)`.
- [ ] **GUIDED** — mock pages render; `Spotlight` cut-out over `active.spotlight`; **address = ONE grouped highlight**; `FieldOverlay` typeable + persists + bilingual aria-label; `GuideBox` never covers the focused field.
- [ ] **CHAT** — `ChatWidget` → `/api/chat` → grounded mock answer; "what's a personal guarantee?" works; bilingual.
- [ ] **EXPORT** — JSON + CSV download (shipped); PDF downloads a real generated file.
- [ ] **BILINGUAL** — flipping to ES translates **content AND chrome** (Back/Next/Send/"Step X of Y"/chat greeting) across every component.
- [ ] **DEMO** — the full flow above runs end-to-end on the sample in ≤90s, rehearsed 3×.

---

## 🔒 FROZEN SEAMS — never rename these (the app already imports them; a rename = build break)

| File (owner) | Must keep EXACTLY |
|---|---|
| `lib/extract.ts` (Michael) | `export async function analyzeDocument(req: AnalyzeRequest): Promise<DocumentModel>` — **not** `extractDoc` |
| `lib/chat.ts` (Michael) | `export async function chatAnswer(req: ChatRequest): Promise<ChatResult>` — **not** `answer` |
| `lib/export.ts` (Michael) | `export function exportDoc(doc, format: ExportFormat, lang?): void` — it triggers the download **itself** (not `Promise<Blob>`, not `fillAndExport`). Do any PDF generation INSIDE it. |
| `lib/mock.ts` (Michael) | `export const MOCK_DOC: DocumentModel` (you may ADD more named exports) |
| `lib/extract.ts` → `lib/ai.ts` | `import { normalizeDoc } from "@/lib/ai"` — use Preston's; **don't** write a second normalizer |
| `components/Spotlight.tsx` (Sawyer) | called as `<Spotlight rect={...} />` in `DocCanvas`; if you change its props, update `DocCanvas` in the SAME commit (you own both) |

> Backstop: Preston re-runs `npm run build` before every merge — any seam break is caught before it hits `main`. But keeping the names right the first time saves a rework cycle.

---

## 🎬 Demo run-of-show (matches the REAL one-screen layout — there are NO tabs)
The app shows everything on one screen: **left rail = 🛡️ Protect (RiskSummary) + ✅ Checklist**, **center = the Guided document canvas + tour controls**, **floating chat bottom-right**.

1. "This is an SBA loan application — 50 pages people give up on." → click **Try the sample**.
2. Point at the **left rail**: the 3-sentence summary + the red trap chips (deadline, $2,500 fee, background check, personal guarantee).
3. "It became a checklist." Point at the **Checklist** — incl. *"Upload your 2025 tax return,"* *"Get an EIN."*
4. "And it walks you through the form." In the **center**, the spotlight lands on the **address as ONE highlight** — type into it; the guide box sits clear of the field.
5. Open the **chat**, ask *"what's a personal guarantee?"* → grounded answer.
6. Hit **Export** → a file downloads. "From a scary 50-page form to done."

---

## 🔁 Integration loop (Preston)
Branch pushed → I pull → confirm no `lib/types.ts` edits → `npm run build` green → merge to `main` → "pull main" → tell that teammate their next focus. `main` stays demo-ready the whole time.
