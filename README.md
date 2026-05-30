# Decode This 🔓

> 👋 **Teammates: open [`START-HERE.md`](./START-HERE.md) — find your name, run one line, paste one sentence to your AI. Done.**

**It decodes everything — the paperwork you can't read, and the words you can't find.**

Built at Hack the Valley (CSUB, Bakersfield) — 8-hour build. Tracks: **AI · Social Impact · Education.**

## The problem
A Spanish-speaking parent in Bakersfield gets official mail she can't fully read — a Medi-Cal letter, a school form, a bill. She might miss a deadline, get scammed, or just feel powerless. And when *she* needs to say something back — to a teacher, a clinic, an agency — she can't always find the right words in English.

## What it does — both directions
- **📄 Decode a document (world → you):** snap a photo of any confusing document → plain-language explanation, in **English or Spanish**, **read aloud**, with a ⚠️ triage flag (urgent / deadline / scam) and a ready-to-send reply.
- **💬 Find my words (you → world):** speak or type a messy thought in any language → get back the polished email, letter, or form answer you need.

## Stack
- **Next.js** (App Router, TypeScript, Tailwind)
- **Claude API** (vision + language) via `@anthropic-ai/sdk`, forced-tool structured output
- **Browser SpeechSynthesis** (read-aloud) + **Web Speech API** (voice input) — free, no keys
- No database, no auth, no custom art. One screen, two flows.

## Run it
```bash
npm install
cp .env.example .env.local   # add a free GEMINI_API_KEY (or skip it — mock data works without any key)
npm run dev                  # http://localhost:3000
```
> No API key? The app returns realistic **mock data** so you can build the whole UI offline. Free Gemini key: https://aistudio.google.com/apikey

## For the team
👉 **Read [`TEAM.md`](./TEAM.md) first.** It has the roles, the data contract, the git rules, and a one-page job sheet for each person in [`tasks/`](./tasks).
