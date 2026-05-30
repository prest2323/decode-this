# Decode This — Pitch (owned by Aiden)

## One-liner
**Decode This — drop in any scary document. We protect you, then walk you through it, field by field.**

---

## The 90-second demo script — the SBA-loan hero

The hero document is an **SBA 7(a) small-business loan application**. It's the perfect villain: long, intimidating, and full of real traps.

**1. Cold open — the scary doc (12s).**
Hold up the document (or show the 30+ page scroll on screen). *"This is an SBA 7(a) loan application. It's how a first-time business owner gets funded — and it's 30 pages of legal traps. A personal guarantee that puts your house on the line. A guaranty fee nobody explains. Hard deadlines. Background checks."* Let the room feel the wall of paper. **Make the document the villain.**

**2. Drop it in → PROTECT (15s).**
Drag the file into Decode This. ~1s shimmer, then the **Protect** view lands:
- a **3-sentence plain summary** in calm language,
- and a row of **trap flags**: ⏰ *deadline*, 💸 *guaranty fee*, ⚖️ *personal guarantee — legal risk*, 🔎 *background check*.
*"Before you fill a single field, it tells you what you're walking into."* Point at the personal-guarantee flag — that's the one that scares people.

**3. The CHECKLIST materializes (15s).**
Open the **Checklist** view. *"It read the whole thing and turned it into steps."* Scroll the list and point at the two *kinds*:
- **Step 1: Upload your 2025 tax return** — an *external* prerequisite (📄 gather-document). It's not on the page; it's something you go get.
- **Step 3: Fill the ownership section** — an *on-page* field (✏️ fill-field).
*"Same list — some steps you fill here, some you gather first. Nothing slips through."*

**4. THE BEAT — the GUIDED tour (20s).**
Start the guided walkthrough. The document opens **inside the platform**. A **spotlight** dims everything except the address block — and here's the trick: street + city + state + zip light up in **ONE** highlight, not four. The **guide box** floats off to the side, *never* covering the field. **Type the address directly into the document.** *"It walks you field by field. One spotlight per idea. The guidance never covers what you're filling."* This is the wow — pause a second and let the spotlight do the talking.

**5. Ask the CHAT (13s).**
Open the chat. Type: *"What's a personal guarantee?"* It answers in plain language, grounded in **this** document and the step you're on. *"It knows where you are. No googling, no consultant."* (Flip the language toggle to **ES** for a beat — the whole thing speaks Spanish.)

**6. EXPORT + close (10s).**
Click **Export → PDF.** The filled form downloads. *"From a 30-page wall of traps to a finished, filed-ready form — in 90 seconds."* Hold up the original scary doc one more time. *"This used to be the thing that made you give up. Now it walks you through it."*

---

## Why us — the insight (don't skip this)

Most "AI document" demos do one trick. Ours does five — **from a single extraction** — because of one design decision:

> **The atomic unit is a Requirement, not a field.** A field is just one *kind* of requirement. Protect, Checklist, and Guided are three lenses on the SAME requirement list.

We extract the document once into an ordered list of requirements, then render it three ways. No duplicated logic, no drift. That's the difference between a demo and a platform — and it's why we can add a sixth view tomorrow without touching the extraction.

Plus: **bilingual EN/ES** end to end, and it **runs fully offline on mock data** — so the demo can't be killed by the network.

---

## What we learned (judging criterion)

- **Grouping beats granularity.** Our first spotlight put a box on every field — it looked like a ransom note. Defining a requirement's spotlight as the **bounding box of its fields** (street + city + state + zip = one highlight) was the single biggest jump in how *calm* the tour feels.
- **Placement is a feature, not a detail.** Users explicitly don't want the guide text covering the field they're typing in. Floating the guide box into the **largest free quadrant** relative to the spotlight — pure geometry, no tour library — made the walkthrough feel designed instead of bolted-on.
- **You don't need a vector DB to ground a chat.** The document is small. Context-stuffing the `DocumentModel` + the active step gave grounded, fast answers with zero infrastructure — the right call for a demo, and honestly for a doc this size, the right call period.

---

## Why it matters

Every year, people who *should* get a small-business loan walk away from the paperwork — or pay a consultant hundreds of dollars to translate it. The traps are real (a personal guarantee can cost you your house), and the tedium is brutal. Decode This protects you from the traps and walks you through the tedium, in your language, for free. The SBA loan is the hero — but the platform is the same for any scary document: a lease, a benefits form, an immigration notice. **Drop it in. We've got you.**
