# Decode This — LOCKED DESIGN

**Name:** Decode This  ·  **Tagline:** *"The bilingual kid who reads your mail."*

**One-liner:** Point your phone at a scary letter and a calm voice in your language tells you whether it's an emergency, what they want, and exactly what to say back — and when you need to answer, just talk and it writes the reply for you.

## The concept (one loop, not two features)
Decode This is *"the bilingual kid who reads the mail"* — and answering the letter is the second half of the **same** loop. The decode output is **urgency-first**, giving a frightened person the three things they need, in order:
1. **Is this an emergency?** — a red/yellow/green urgency flag with the deadline extracted and shown as a human countdown (*"by Fri, Jun 5 — 6 days left"*), spoken first.
2. **What does it want from me?** — one plain sentence at a 5th-grade reading level (the real wedge: bureaucratic English → readable Spanish/English, not just translation).
3. **Here's what to say back** — a ready-to-send bilingual reply.

*"Find my words"* is that reply step generalized: the user talks, it produces clean, sendable text. Demoed as one continuous **María / Medi-Cal** persona across both halves. Provider is frozen on **Gemini (free tier)** so code and pitch agree.

## What makes it win (vs. a generic LLM-wrapper judges have seen 10×)
1. **Urgency-first triage** — every other tool buries the deadline; we say it first as a human countdown.
2. **Reading level, not just language** — bureaucratic English → 5th-grade-readable, reassuring Spanish/English (*"You don't have to pay it all today"*).
3. **Bidirectional, closes the loop** — decode the scary paper AND find the words to answer it, one continuous persona.
4. **The emotional close** ("now it's just mail") makes a judge see their own family — beats novelty on the *usefulness* criterion.

## The 90-second demo script
1. **Cold open (10s)** — hold up the real paper, not the screen. *"This came in María's mailbox. She cleans houses in Bakersfield, three kids, speaks Spanish. This letter only speaks English — and gives her 6 days to do something she can't read."* Make the paper the villain.
2. **The scan (12s)** — phone over the letter, one tap, upload the staged hero photo. ~1s shimmer. Photo thumbnail stays beside the result.
3. **The reveal — urgency first (13s)** — decoded card lands in Spanish next to the photo: bold pill *"⚠️ Por vencer · 5 de jun — faltan 6 días"*, then three calm sentences. Don't read it; let the room see calm Spanish beside the wall of English.
4. **THE BEAT — read aloud (18s)** — tap play; warm es-MX voice speaks the summary, deadline first, ending on the reassurance line. **Stop talking. Hold 2 seconds of silence.** This silence is the demo.
5. **The reverse — Find my words (20s)** — switch tabs. *"But María has to answer."* Tap mic, speak Spanish: *"Necesito más tiempo, quiero pagar poco a poco."* Tap the "Kern County Medi-Cal" chip. Submit → clean sendable message → Copy. *"From silent to heard in fifteen seconds."*
6. **Widen + close (17s)** — *"There are 40,000 Spanish-speaking households in Kern County getting letters like this — from the court, the school, the hospital. Every one has a kid translating things a kid shouldn't have to."* Hold the paper up. *"This used to be the scariest thing in María's house. Now it's just mail."* Drop the paper. Walk off the line.

## Feature tweaks (all shipped in the baseline)
- Human-format the deadline as a bold countdown pill ✅
- Copy on the ready-to-send reply ✅ · Read-aloud on the express result ✅
- Show the uploaded photo next to the decoded card (before/after) ✅
- Audience chips wired end-to-end (Lead forwards `audience`) ✅

## Cut list (do NOT build)
- No database, auth, accounts, or document history.
- Don't gate the demo on the live API — it runs on baked mock data (`?demo=1` is network-proof).
- No PDF/multi-page/OCR/HEIC — phone-photo JPEG only.
- Only TWO rehearsed demo docs (Medi-Cal hero + optional scam), not four.
- Don't let Vercel/QR be a demo gate — rehearse on localhost.
- No dark-mode theming (the broken `@media` block is deleted), no streaming, no fancy animation.
- Don't chase Anthropic credits — freeze on free Gemini.
- For the hero beat, pre-stage the result (and ideally pre-rendered audio) so the wow can't fail.

## Top risks → mitigations
- **Judge device in dark mode** → fixed light theme (dark block deleted). ✅ done.
- **Mock card self-contradiction (3 dates)** → one coherent timeline (ends Jun 12 / renew by Jun 5). ✅ done.
- **English-only reply breaks bilingual shot** → `draftReply` now bilingual. ✅ done.
- **es-MX voice missing on demo laptop** → verify early on the ACTUAL laptop; if shaky, pre-render Spanish summary to a local MP3.
- **Live API hangs / off-spec response** → demo on mock (`?demo=1`); Gemini output is normalized so it can't crash the UI. ✅ hardened.
