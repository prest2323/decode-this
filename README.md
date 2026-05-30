# Decode This 🔓

> 👋 **Teammates: open [`START-HERE.md`](./START-HERE.md) — find your name, run one line, paste one sentence to your AI. Done.**

**Drop in any scary document. We protect you, then walk you through it — field by field.**

Decode This is a guided document-walkthrough platform. The hero document is an **SBA 7(a) small-business loan application** — 30+ pages of legal traps and tedious fields. You drop it in; we make it survivable.

## The problem

A first-time small-business owner sits down with a 30+ page SBA loan application. It's full of traps they can't see — a **personal guarantee** that puts their house on the line, a **guaranty fee** nobody explains, hard **deadlines**, **ownership and background checks**. And it mixes on-page fields to fill with off-page prerequisites to gather (a 2025 tax return, an EIN). Most people either give up, or pay a consultant hundreds of dollars to hold their hand through it. They shouldn't have to.

## What it does — five capabilities, one document

1. **🛡️ Protect** — a 3-sentence plain-language summary, and it surfaces the hidden traps: deadlines, fees, required background checks, personal-guarantee / legal risk. You know what you're walking into *before* you fill anything.
2. **✅ Checklist** — it extracts **every** requirement into an interactive step-by-step checklist. *"Step 1: Upload your 2025 tax return. Step 2: Get your EIN. Step 3: Fill the ownership section."* Some steps live on the page; some are external prerequisites you gather, check off, or pay.
3. **🎯 Guided** — it opens the document **inside the platform** and walks you field by field with on-document **spotlights** (intelligently grouped — street + city + state + zip in ONE highlight), guide text placed so it **never** covers the field you're filling. You type directly into the document.
4. **💬 Chat** — a context-aware widget grounded in the document **and** the step you're on. Ask *"what's a personal guarantee?"* and get a plain answer that knows where you are.
5. **📤 Export** — your filled data exports as a real filled **PDF**, plus **JSON**, **CSV**, and **DOCX**.

Everything is **bilingual EN/ES** — we carried the old app's accessibility strength forward.

### The insight that ties it together

The atomic unit is a **Requirement**, not a "field." A field is just one *kind* of requirement. Protect, Checklist, and Guided are three **lenses on the same requirement list** — one extraction powers all three. That's why it's a platform, not three demos taped together. The full design is in [`docs/PLAN.md`](./docs/PLAN.md).

## Stack

- **Next.js 16** (App Router, TypeScript), **React 19**, **Tailwind v4**
- **AI:** Google Gemini (free tier, **default**) via `@google/genai`, or Anthropic Claude via `@anthropic-ai/sdk` — the API auto-selects based on which key is set; structured JSON output either way
- **PDF:** `pdfjs-dist` to render pages to a canvas, `pdf-lib` to fill the AcroForm and flatten on export
- **Spotlight + guide box:** custom (an SVG dim with a cut-out hole + collision-free guide placement) — not a tour library
- **Chat:** context-stuffed (the document + the active step), no vector DB — the doc is small and the demo is fast
- No database, no auth, no custom art

## Run it

```bash
npm install
npm run dev                  # http://localhost:3000
```

Want the real model instead of mock data? Add a free key:

```bash
cp .env.example .env.local   # add GEMINI_API_KEY (free) — or skip it; mock data works with no key
```

> **No API key? Everything still works.** With no key, `/api/analyze` and `/api/chat` return realistic **mock data** (a full SBA `DocumentModel`), so you can build and demo the entire platform offline. Free Gemini key: https://aistudio.google.com/apikey

## For the team

👉 **Read [`TEAM.md`](./TEAM.md) first** for roles, the data contract, and git rules — then your one-page job sheet in [`tasks/`](./tasks). The locked design and phased build plan live in [`docs/PLAN.md`](./docs/PLAN.md) (it supersedes the old `docs/DESIGN-LOCKED.md`).
