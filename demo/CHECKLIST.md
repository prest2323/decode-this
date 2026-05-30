# 🔍 Pre-Demo Smoke Test Checklist — Decode This v2

Run this smoke test before going live on stage to ensure everything works flawlessly and there are no visual glitches.

## 🧱 Setup & Environment
- [ ] No API keys are set. Verify that the app runs in **Offline / Mock-Only Mode**.
- [ ] Run `npm run build` and ensure there are no compilation errors.
- [ ] Run `npm run dev` and open `http://localhost:3000`.

## 📦 Beat-by-Beat Functional Validation

### 1. Upload & Initialization
- [ ] Landing page loads with "Try the sample" call-to-action.
- [ ] Clicking **"Try the sample"** loads the mock DocumentModel successfully.
- [ ] Check that `RiskSummary`, `ChecklistPanel`, and `TourController` render without crashing.

### 2. Protect View (RiskSummary)
- [ ] Title shows **"Borrower Information Application"** (or Form 1919).
- [ ] The 3-sentence plain language summary is clearly readable in the white card.
- [ ] Traps are prioritized: Red **deadline** and yellow **fee** chips appear before green **tips**.
- [ ] Hovering over the flag chips shows a subtle micro-animation scale-up.

### 3. Checklist Panel
- [ ] Checklist displays the numbered steps.
- [ ] Icons correspond to the requirement type (✏️ for fill-field, 📄/📎 for documents, etc.).
- [ ] Active step is highlighted with a prominent indigo outline (`ring-2 ring-indigo-500 bg-indigo-50/50`).
- [ ] Clicking a checkbox toggles the status (`todo` / `done`) and increments the top progress counter (`X/Y done`).
- [ ] Clicking the row body moves the active step focus to that index.

### 4. Guided Tour & GuideBox Positioning
- [ ] On Step 3 (Address), a yellow spotlight is visible on the canvas covering Street, City, State, and Zip as **one unified rectangle**.
- [ ] GuideBox sits completely clear of the highlighted address field (either above or below it).
- [ ] Resizing the browser window recalculates the guide card coordinates smoothly to maintain a collision-free position.
- [ ] Clicking **"Got it, next"** marks the step done, advances the tour, and updates the center focus.

### 5. Bilingual Toggle (Chrome & Content)
- [ ] Click the **EN / ES** language toggle button.
- [ ] Verify that Checklist steps, summaries, and guidance update to Spanish.
- [ ] Verify that UI Chrome elements translate correctly:
  - `Back` ➔ `Atrás`
  - `Next` ➔ `Siguiente`
  - `Step X of Y` ➔ `Paso X de Y`
  - `Finish` ➔ `Terminar`
  - `Send` ➔ `Enviar`
  - Chat greeting ➔ Spanish context instruction.

### 6. Grounded Chat
- [ ] Click **💬 Ask about this document** to open the chat drawer.
- [ ] The initial AI greeting dynamically mentions the active step name.
- [ ] Type: *"what is a personal guarantee?"* and hit Enter.
- [ ] AI returns a grounded answer explaining the risk of Form 1919 personal guarantee.
- [ ] Message log auto-scrolls to the bottom upon receiving responses.
- [ ] Sending state displays a pulsing loading indicator.

### 7. Celebration & Export
- [ ] Mark all steps as complete.
- [ ] Emerald **"🎉 Ready to File!"** banner appears both at the bottom of the canvas and at the top of the Checklist.
- [ ] Clicking **"Export Completed Package"** downloads a generated PDF (or JSON/CSV) asset.
