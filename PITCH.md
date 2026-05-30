# 📢 TEAM PLAYBOOK & JUDGE PITCH — Decode This v2

## 🎯 The One-Liner
**Decode This v2** turns intimidating, jargon-filled business documents—starting with the grueling **SBA 7(a) loan application**—into visual, interactive, bilingual step-by-step walkthroughs that protect users from hidden traps and guide them to error-free completion.

---

## ⏱️ The 90-Second Demo Pitch Script

### **1. The Hook (0:00 - 0:15)**
* *"This is an SBA 7(a) small business loan application. It's the absolute lifeblood of American entrepreneurship—and it's a 30-page legal nightmare. Most business owners give up, or pay expensive consultants thousands of dollars just to explain it. Why? Because the traps are real: background checks, hidden guaranty fees, and a personal guarantee clause that puts your family home on the line. Today, we're decoding it."*

### **2. The Solution & Protect (0:15 - 0:30)**
* **[Action: Click "Try the sample"]**
* *"Drag, drop, and the screen lights up. Our **Protect** view instantly translates 30 pages of fine print into a simple, 3-sentence plain language summary and pulls out the prioritized high-risk trap flags. Right at the top, you see the non-refundable guaranty fee, the hard deadline, and that terrifying personal guarantee warning before you even type a single letter."*

### **3. The Interactive Checklist (0:30 - 0:45)**
* **[Action: Point to Checklist and click steps]**
* *"Next, our **Checklist** turns the entire document into a simple, ordered roadmap. We solved a huge UX problem here: distinguishing off-page requirements—like gathering your 2025 tax returns or obtaining an EIN—from on-page form fields. Clicking any step updates your state and moves your guide immediately."*

### **4. The Guided Tour & Collision-Free Guide (0:45 - 1:05)**
* **[Action: Type into the Address block, toggle ES (Spanish)]**
* *"When you fill the form, our **Guided Tour** focuses you with high-visibility spotlights. Rather than boxing individual inputs like a ransom note, we group related items—Street, City, State, and Zip—into **one unified spotlight**. And look at our floating GuideBox: it computes the largest free space relative to the spotlight so it **never covers the inputs** you're active on. Switch to Spanish, and the entire interface, from checklists to progress indicators, dynamically translates."*

### **5. Grounded Chat (1:05 - 1:20)**
* **[Action: Open Chat, send "what is a personal guarantee?"]**
* *"If you're still confused, our floating **AI Chat** is fully context-aware. It knows exactly which step you are on, and answers questions in simple 5th-grade terms. No search engines, no external links—grounded, immediate clarity."*

### **6. Celebration & Export (1:20 - 1:30)**
* **[Action: Mark steps complete, click "Export Completed Package"]**
* *"Once all steps are marked done, the screen celebrates your success, and one click exports a filled, verified, ready-to-file PDF package. We transformed a 3-hour anxiety attack into 90 seconds of confidence."*

---

## 🛠️ Why Us: The Technical Insight

Most AI document tools do one trick. Ours does five—from a single extraction—because of our core architectural choice:
> **The atomic unit is a Requirement, not a field.**

A field is just one *kind* of requirement (`type: "fill-field"`). By modeling everything as a unified `Requirement[]` spine inside `lib/types.ts`:
1. **Protect** filters the spine for high-risk flags.
2. **Checklist** renders the spine as interactive milestones.
3. **Guided** projects the spine's field coordinates onto the document canvas.
4. **Chat** uses the active requirement ID to ground its prompts.
5. **Export** writes the completed requirement values back to the PDF.

One clean JSON model, three powerful visual lenses, zero state drift, and fully bilingual EN/ES capability. Because it runs locally against mock data when no API keys are present, the app works flawlessly offline, making it immune to conference Wi-Fi failures.

---

## 💡 What We Learned (Honest Reflections)

* **Calm beats granular.** In our early prototypes, we drew a flashing red box around every individual form input. It felt chaotic. Grouping fields into logical bounding boxes (e.g., Street + City + State + Zip = **one unified spotlight**) made the walkthrough feel incredibly serene and designed.
* **Math beats heavy libraries.** We didn't need a bulky tour library to position our guide cards. Writing a simple, pure geometry-based helper that calculates the surrounding free space on window resize kept our bundle tiny and our placement perfectly collision-free.
* **Grounding doesn't require a Vector DB.** Business documents are relatively small. Stuffing the active `DocumentModel` + the active step ID directly into the LLM system prompt gave hyper-relevant, context-aware chat answers with zero database overhead.

---

## 📝 Printable Judge One-Pager

### **What is Decode This v2?**
Decode This v2 is a document walkthrough platform that strips the fear out of complex legal paperwork. Users drop in a document, and the AI translates it into visual, guided actions.

### **Features Judges Love:**
* **🛡️ Protect view:** Instantly flags liabilities, fees, and deadlines.
* **📋 Smart Checklist:** Distinguishes on-page inputs from external preparation steps.
* **🎯 Grouped Spotlights:** Highlights conceptual sections instead of isolated inputs.
* **🚫 Collision-Free GuideBox:** Positions itself dynamically in the largest free space.
* **🌐 Bilingual Core:** Full EN/ES translation across content and system chrome.
* **💬 Context-Aware Chat:** Grounded in the active step for immediate jargon busting.

### **Try the Live App:**
* **Deploy URL:** `https://decode-this-v2.vercel.app`
* *(A QR code linking directly to Michael's production Vercel deployment goes here)*

