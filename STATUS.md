# 📊 STATUS — Decode This v2 (live board)

**Mission Control = the main Claude Code chat (Preston, Lead).** Update your row when status changes. Ping Preston in group chat with blockers.

_Last updated: base template shipped — start of Phase 1_

## Who's on what
| Person | AI | Branch | Now building | Status | Blocked on |
|---|---|---|---|---|---|
| **Preston** (Lead) | Claude Code | `phase1-preston` | Spine (`types`/`store`/`ai`) + analyze/chat routes + Workspace + integration + deploy | 🟡 in progress | — |
| **Michael** | Claude Code | `phase1-michael` | Engine: SBA mock, extract, chat-grounding, export, prompts, eval harness | ⚪ not started | — |
| **Sawyer** | Gemini (Antigravity) | `phase1-sawyer` | DocCanvas + FieldOverlay + Spotlight + Uploader + theme | 🟢 PR open | — |
| **Aiden** | Gemini (Antigravity) | `phase1-aiden` | Checklist + GuideBox + Tour + Chat widget + RiskSummary + demo + pitch | ⚪ not started | — |

Legend: ⚪ not started · 🟡 in progress · 🟢 PR open · ✅ merged · 🔴 blocked

## Integration checkpoints (everyone pulls `main`)
- [ ] **0:30** — everyone on new `main`, running on the SBA mock, branch `phase1-<name>` made
- [ ] **3:30** — Integration #1: real analyze/extract wired, all components merged, vertical slice green
- [ ] **6:30** — feature complete (Protect + Checklist + Guided tour + Chat + Export), polishing
- [ ] **7:30** — 🧊 CODE FREEZE

## The vertical slice we protect first
upload → analyze (mock) → **Checklist + Canvas with spotlight tour + fill + chat + export**, all working on the SBA `DocumentModel`. Broaden file types / real parsing only after the slice is green.

## Contract changes log (Preston only)
_Any change to `lib/types.ts` gets one line here so everyone knows to pull. Nobody else edits types._
- (none yet — v2 contract is the `DocumentModel` / `Requirement` spine shipped in the base template)

## Blockers / decisions needed
- (none yet)

## Done ✅ (base template shipped — green on mock)
- [x] v2 contract locked: `DocumentModel` → `Requirement[]` spine in `lib/types.ts`
- [x] Client store `lib/store.ts` (React context + reducer) with `useDoc()` — `loadDoc / setLang / goTo / next / prev / setFieldValue / setStatus / exportAs`
- [x] Provider auto-select `lib/ai.ts` (Gemini default → Anthropic fallback → **mock when no key**) + crash-proof normalization so an off-spec model reply can never crash the UI
- [x] `/api/analyze` + `/api/chat` routes returning the SBA mock with no key
- [x] `app/page.tsx` Workspace layout wiring every view to the store
- [x] Every component shipped as a **compiling, running stub** — Phase 1 is deepen-your-files, not start-from-blank
