# TEAM PLAYBOOK — Decode This

We are 4 people, each driving an AI. **Read your one-page job sheet in [`tasks/`](./tasks) — but read THIS whole file first.** It's 5 minutes and it's what stops us from stepping on each other.

---

## 👥 Who does what

| # | Person + AI | Role | Owns these files ONLY |
|---|---|---|---|
| 1 | **You + Claude Code** (this one) | **Lead / Backend / Integrator** | `lib/types.ts`, `lib/prompt.ts`, `lib/mock.ts`, `app/api/decode/route.ts`, `app/page.tsx`, deploy, all merges |
| 2 | **Teammate + Claude Code** | **Core UI (Decode side)** | `components/ResultCard.tsx`, `components/LanguageToggle.tsx`, `app/globals.css` |
| 3 | **Teammate + Antigravity (Gemini)** | **Input & Voice** | `components/Uploader.tsx`, `components/ReadAloud.tsx`, `components/MicInput.tsx` |
| 4 | **Teammate + Antigravity (Gemini)** | **Express UI + Demo + Pitch** | `components/ExpressInput.tsx`, `components/ExpressResult.tsx`, `demo/`, `PITCH.md` |

**The golden rule: only edit files in YOUR row.** If you need a change to someone else's file (especially `lib/types.ts`), ask the Lead in chat. The Lead owns the contract.

---

## 🤖 Which AI each teammate installs
- **Two of us use Claude Code** (persons 1 & 2). The repo's `CLAUDE.md` auto-loads the rules.
- **Two of us use Antigravity with Gemini** (persons 3 & 4). Why Gemini and not DeepSeek? Antigravity is Google's agentic IDE — it's built around Gemini 3 with a generous free tier and native file-editing. DeepSeek isn't wired into that agent loop, so you'd fight the tools all day. The repo's `AGENTS.md` auto-loads the same rules for Antigravity.
- Full install steps for each are in [`tasks/00-SETUP.md`](./tasks/00-SETUP.md).

---

## 📜 THE CONTRACT (do not change without the Lead)
Everything talks through the types in [`lib/types.ts`](./lib/types.ts). The two results:

```ts
DecodeResult  // a document made plain: title/meaning/action (en+es), deadline, urgency, draftReply
ExpressResult // your thought made into words: kind, formatted, note
```
The API lives at **`POST /api/decode`** and accepts `{ mode: "decode", image }` or `{ mode: "express", text, lang }`.
**Build against [`lib/mock.ts`](./lib/mock.ts)** — the app returns mock data when there's no API key, so you never wait on the backend.

---

## 🌿 GIT RULES — how we don't wreck the repo
This is the most important section. **Tell your AI these rules explicitly.**

1. **Never commit to `main`.** Each person works on their own branch: `git checkout -b ui-<yourname>`.
2. **Only touch files in your row** of the table above. Do **not** let your AI "helpfully" refactor shared files, rename things, or reformat the whole repo.
3. **Pull before you start, commit small, push often:**
   ```bash
   git pull origin main          # start of the day / before big changes
   git add <your files>          # add ONLY your files, never `git add -A` blindly
   git commit -m "ui: result card layout"
   git push origin ui-<yourname>
   ```
4. **Open a PR; the Lead merges.** Don't merge your own PR into main.
5. **Never `git push --force`. Never delete others' files. Never commit `.env.local` or `node_modules`** (already gitignored — keep it that way).
6. If you hit a conflict, **stop and ping the Lead.** Don't have your AI auto-resolve a merge it doesn't understand.

> Paste this to your AI at the start: *"Only edit the files I name. Do not refactor, rename, reformat, or touch any other file. Work on my branch. Never force-push."*

---

## ⏱️ Timeline (8 hours)
| Time | What |
|---|---|
| 0:00–0:30 | Everyone clones, `npm install`, `npm run dev` works, reads their task sheet |
| 0:30–3:30 | Parallel build against mock data |
| 3:30–4:30 | **Integration #1** — Lead wires real API; everyone pulls main |
| 4:30–6:30 | Polish, EN/ES voice, triage + draft-reply, gather real demo docs |
| 6:30–7:30 | Deploy + QR (stretch), rehearse the 90-sec pitch 3× |
| 7:30–8:00 | **CODE FREEZE.** Final rehearsal only. |

---

## 🏆 What we're judged on (and who owns each)
Judges score **usefulness, execution, clarity, learning**.
- **Usefulness** → real local user + real documents (Person 4's demo)
- **Execution** → small scope + clean file ownership + 7:30 freeze (everyone)
- **Clarity** → the decode UI is legible across a room (Person 2)
- **Learning** → the "what we learned" slide (Person 4 in `PITCH.md`)
- **Creativity hook** → the two-way decode + triage + draft-reply (Lead's backend)

The demo money moment: **hold up a real scary letter → the laptop explains it out loud in Spanish.** Person 4 scripts it, Person 3 makes the voice flawless.
