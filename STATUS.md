# 📊 STATUS — Decode This (live board)

**Mission Control = the main Claude Code chat (Lead).** Update your row when status changes. Ping the Lead in group chat with blockers.

_Last updated: start of hack_

## Who's on what
| Person | AI | Branch | Now building | Status | Blocked on |
|---|---|---|---|---|---|
| **Preston** (Lead) | Claude 5x | `main` | API route + Gemini wiring + integration | 🟡 in progress | — |
| **MK** | Claude 5x | `ui-mk` | Prompts + mock + deploy + QA | ⚪ not started | — |
| **Sawyer** | Gemini 3.1 Pro | `ui-sawyer` | Decode UI: ResultCard, Toggle, Uploader, ReadAloud, theme | ⚪ not started | — |
| **Aiden** | Gemini 3.1 Pro | `ui-aiden` | Express UI + Mic + demo docs + pitch | ⚪ not started | — |

Legend: ⚪ not started · 🟡 in progress · 🟢 PR open · ✅ merged · 🔴 blocked

## Integration checkpoints (everyone pulls `main`)
- [ ] **0:30** — everyone running on mock, branch made
- [ ] **3:30** — Integration #1: real API wired, all components merged
- [ ] **6:30** — feature complete, polishing
- [ ] **7:30** — 🧊 CODE FREEZE

## Contract changes log (Lead only)
_Any change to `lib/types.ts` gets one line here so everyone knows to pull._
- (none yet)

## Blockers / decisions needed
- (none yet)

## Done ✅
- [x] Repo + scaffold + mock app building green
