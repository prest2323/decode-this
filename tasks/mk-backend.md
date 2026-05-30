# MK (Claude Code) — Backend #2: Prompts, Mock, Deploy

You're on backend with Preston. **Preston owns** `lib/types.ts` (the contract), `app/api/decode/route.ts`, and `app/page.tsx`. **You own:**
- `lib/prompt.ts` — the AI prompts for decode + express
- `lib/mock.ts` — the realistic fake data everyone builds against
- Deploy: Vercel + QR code
- QA: test real documents through the app, find what breaks

## Your mission
Make the AI output *great* and make sure the app is deployed + tested.

Priorities:
1. **Tune `lib/prompt.ts`** so decode returns clean, plain-language EN+ES with a correct deadline + urgency flag, and express returns a polished, send-ready message. Test against real demo docs (get them from Aiden's `demo/` folder).
2. **Keep `lib/mock.ts` realistic** — it's what the UI looks like before the API is wired, so make it look like a real winning result.
3. **Deploy** to Vercel once Preston says the API is stable; set the API key in the Vercel dashboard; generate a QR code for judges.
4. **QA pass** at ~5 PM: run all 4 demo docs through the live app, log anything weird in `STATUS.md`.

## Rules
- Don't edit `lib/types.ts`, `route.ts`, or `page.tsx` — coordinate with Preston (ping in chat).
- Work on branch `ui-mk`. PR → Preston merges.

## Done when
- [ ] Decode + express prompts produce demo-quality output on real docs
- [ ] App deployed to a public URL + QR code made
- [ ] All 4 demo docs tested live, results logged
