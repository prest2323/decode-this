# 🚀 START HERE — find your name, do 2 things

You'll **(A)** run one line in a terminal, then **(B)** paste one sentence to your AI. That's it — your AI runs itself after that.

> **The v2 base template is on `main`.** If you already have the repo, just **pull**. If you don't, clone. Either way you'll branch `phase1-<yourname>` off the new main. Old branches are obsolete.

First, everyone: **accept your repo invite** → https://github.com/prest2323/decode-this/invitations

---

## 🟪 MICHAEL — Backend Engine  (Claude Code)
**A) Run this one line** (have the repo already → use the `git pull` form; brand new → use the `git clone` form):
```
git pull origin main && npm install && git checkout -b phase1-michael
```
```
git clone https://github.com/prest2323/decode-this.git && cd decode-this && npm install && git checkout -b phase1-michael
```
Then open the `decode-this` folder in Claude Code.

**B) Paste this one sentence to your AI:**
> Read `tasks/queue-michael.md` and work it as an autonomous loop: do the first unchecked task, test with `npm run dev`, mark it `[x]`, then `git add` only my files, commit, and `git push origin phase1-michael` — then continue to the next task WITHOUT waiting for my approval. Follow all rules in TEAM.md and AGENTS.md, stay strictly inside the files I own, never touch others' files, never edit lib/types.ts (Preston owns the contract), and never force-push. Only stop when the queue is empty or you hit a real blocker, and tell me when that happens.

---

## 🟦 SAWYER — Document Canvas + Spotlight + Theme  (Antigravity / Gemini)
**A) Run this one line** (`git pull` if you have the repo, `git clone` if you don't):
```
git pull origin main && npm install && git checkout -b phase1-sawyer
```
```
git clone https://github.com/prest2323/decode-this.git && cd decode-this && npm install && git checkout -b phase1-sawyer
```
Then open the `decode-this` folder in Antigravity.

**B) Paste this one sentence to your AI:**
> Read `tasks/queue-sawyer.md` and work it as an autonomous loop: do the first unchecked task, test with `npm run dev`, mark it `[x]`, then `git add` only my files, commit, and `git push origin phase1-sawyer` — then continue to the next task WITHOUT waiting for my approval. Follow all rules in TEAM.md and AGENTS.md, stay strictly inside the files I own, never touch others' files, never edit lib/types.ts (Preston owns the contract), and never force-push. Only stop when the queue is empty or you hit a real blocker, and tell me when that happens.

---

## 🟩 AIDEN — Checklist / Tour / Chat + Demo + Pitch  (Antigravity / Gemini)
**A) Run this one line** (`git pull` if you have the repo, `git clone` if you don't):
```
git pull origin main && npm install && git checkout -b phase1-aiden
```
```
git clone https://github.com/prest2323/decode-this.git && cd decode-this && npm install && git checkout -b phase1-aiden
```
Then open the `decode-this` folder in Antigravity.

**B) Paste this one sentence to your AI:**
> Read `tasks/queue-aiden.md` and work it as an autonomous loop: do the first unchecked task, test with `npm run dev`, mark it `[x]`, then `git add` only my files, commit, and `git push origin phase1-aiden` — then continue to the next task WITHOUT waiting for my approval. Follow all rules in TEAM.md and AGENTS.md, stay strictly inside the files I own, never touch others' files, never edit lib/types.ts (Preston owns the contract), and never force-push. Only stop when the queue is empty or you hit a real blocker, and tell me when that happens.

---

## When your queue is empty
Tell Preston **"🟢 Queue empty"** — he'll refill it. Mission Control (Preston) merges every pushed branch into `main` and keeps it green. Everything you build runs on the SBA mock, so you never wait on the backend.
