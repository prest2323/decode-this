# 00 · SETUP — everyone does this first (~15 min)

## 1. Get the code
```bash
git clone https://github.com/prest2323/decode-this.git
cd decode-this
npm install
npm run dev        # open http://localhost:3000 — you should see Decode This running on MOCK data
```
The app works with **no API key** (returns mock data). Only the Lead needs the real key.

## 2. Make your branch
```bash
git checkout -b ui-<yourname>     # e.g. ui-sam
```
Never work on `main`. Never commit to `main`.

## 3. Install your AI

### Persons 1 & 2 — Claude Code
- Install: https://claude.ai/code (or `npm i -g @anthropic-ai/claude-code`)
- Open the repo folder. `CLAUDE.md` loads the team rules automatically.
- First thing to tell it: *"Read TEAM.md and my task sheet in tasks/. Only edit the files I own. Work on my branch."*

### Persons 3 & 4 — Antigravity (Gemini)
- Download Antigravity: https://antigravity.google  → sign in with a Google account (free Gemini 3 access).
- Open the `decode-this` folder. `AGENTS.md` loads the team rules automatically.
- First thing to tell it: *"Read TEAM.md and my task sheet in tasks/. Only edit the files I own. Do not refactor or touch other files. Work on my branch."*

> Why Gemini, not DeepSeek: Antigravity is built around Gemini with a free tier and native file-editing agent loop. DeepSeek isn't integrated that way — don't fight the tooling on an 8-hour clock.

## 4. Find your job sheet
| You are | Open |
|---|---|
| Lead (you + Claude) | `tasks/01-lead.md` |
| Core UI (Claude) | `tasks/02-claude-ui.md` |
| Input & Voice (Gemini) | `tasks/03-gemini-input.md` |
| Express + Demo (Gemini) | `tasks/04-gemini-express-demo.md` |

## 5. The one rule that saves the day
**Only edit the files in your row of the table in `TEAM.md`.** When in doubt, ask the Lead in the group chat before editing a shared file.
