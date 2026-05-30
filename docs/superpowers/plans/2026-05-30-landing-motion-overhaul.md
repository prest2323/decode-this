# Landing Page Motion Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `components/Landing.tsx` feel richly, "overly" animated and premium — layering softened always-on ambient motion with input-driven choreography (cursor spotlight, demo tilt, scroll parallax, magnetic CTA, word-by-word headline reveal, pointer-glow cards) — without changing the soft, minimal "Warm Paper & Calm" look at all.

**Architecture:** A new dependency-free motion primitives module (`components/motion.tsx`) exposes small, isolated client components (`Parallax`, `Tilt`, `Magnetic`, `CursorSpotlight`) and one hook (`useScrollProgress`), each backed by `requestAnimationFrame`-throttled pointer/scroll handlers that write to inline styles / CSS custom properties — never React state — so nothing re-renders on mouse move. `Landing.tsx` composes them. `app/globals.css` re-enables the (already-softened) ambient keyframes and adds a word-reveal keyframe. The existing `components/Reveal.tsx` stays unchanged.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 (CSS-first `@theme`), IntersectionObserver, Pointer/Scroll events, CSS transforms/keyframes. **No new dependencies** (team rules forbid them).

**Verification model (read first):** This project has no unit-test runner wired up, and motion is not unit-testable. Each task is verified by: (1) `npx tsc --noEmit -p tsconfig.json` is clean for the touched files, (2) the dev server at `http://localhost:3000` returns HTTP 200, (3) targeted assertions against the served HTML/CSS via `curl` + `grep`, and (4) a one-line manual viewport observation noted in the step. The dev server is already running on :3000; if it is not, start it with `npm run dev` first.

**Global guardrails for every task:**
- Touch only: `components/motion.tsx` (new), `components/Landing.tsx`, `app/globals.css`. Do NOT edit `lib/types.ts` or any file not listed (team contract).
- Motion uses `transform` / `opacity` / `filter: blur` only. No animating width/height/top/left/margin.
- Every pointer/scroll handler must early-return when `window.matchMedia("(prefers-reduced-motion: reduce)").matches` is true.
- Palette, spacing, fonts, and layout must not change. If a step would change a color/size/spacing token, stop — it's out of scope.

---

## File Structure

| File | Responsibility |
|---|---|
| `components/motion.tsx` | **New.** All reusable motion primitives + the rAF/reduced-motion helpers. One file because they share two tiny private helpers and are always imported together. |
| `components/Reveal.tsx` | **Unchanged.** Existing one-shot scroll-entrance primitive. Imported alongside the new ones. |
| `components/Landing.tsx` | **Modified.** Composes the primitives into the page; adds the word-reveal headline markup. |
| `app/globals.css` | **Modified.** Re-enables softened ambient `animation:` declarations; adds `word-rise` keyframe + `.word`/`.word-mask` classes. |
| `components/LiveDemo.tsx` | **Read-only reference.** Sits inside `Tilt`; no edits needed (its own `floaty-soft`/`shimmer` are independent child transforms). |

---

## Task 1: Motion module foundation — helpers, `useScrollProgress`, `Parallax`

**Files:**
- Create: `components/motion.tsx`

- [ ] **Step 1: Create `components/motion.tsx` with the shared helpers + scroll primitives**

```tsx
"use client";
// motion.tsx — dependency-free motion primitives for the landing page.
// All handlers are rAF-throttled and write to inline styles / CSS custom
// properties (never React state), so mouse/scroll movement never re-renders.
// Every primitive no-ops under prefers-reduced-motion, leaving content static.
import { useEffect, useRef } from "react";

/** True when the user has asked the OS to minimize motion. */
function prefersReduced(): boolean {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Returns a scheduler that coalesces calls into one rAF tick. */
function useRaf() {
  const frame = useRef<number | null>(null);
  const schedule = (fn: () => void) => {
    if (frame.current != null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      fn();
    });
  };
  useEffect(
    () => () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    },
    []
  );
  return schedule;
}

/**
 * Writes the element's scroll progress through the viewport (0..1) to a CSS
 * custom property on the element. 0 ≈ just entering from the bottom, 1 ≈ just
 * left past the top. Backing hook for scroll-linked effects.
 */
export function useScrollProgress(
  ref: React.RefObject<HTMLElement | null>,
  varName = "--sp"
) {
  const schedule = useRaf();
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const raw = (vh - rect.top) / (vh + rect.height);
      el.style.setProperty(varName, Math.min(1, Math.max(0, raw)).toFixed(4));
    };
    const onScroll = () => schedule(update);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref, varName, schedule]);
}

/**
 * Translates its child on the Y axis as it scrolls through the viewport,
 * creating depth against neighboring content. `speed` = max px of travel.
 */
export function Parallax({
  children,
  speed = 30,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const schedule = useRaf();
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const center = rect.top + rect.height / 2;
      const p = (center - vh / 2) / (vh / 2 + rect.height / 2); // -1..1
      const y = Math.max(-1, Math.min(1, p)) * speed;
      el.style.transform = `translate3d(0, ${y.toFixed(2)}px, 0)`;
    };
    const onScroll = () => schedule(update);
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [speed, schedule]);
  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck the new file**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -Ei "motion" || echo "CLEAN"`
Expected: prints `CLEAN` (no type errors referencing motion.tsx).

- [ ] **Step 3: Smoke-import the primitives so an unused-export/parse error would surface**

Temporarily verify the module parses by importing it where it will be used — but since wiring happens later, just confirm the dev server still compiles the route that will import it. Run:
Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add components/motion.tsx
git commit -m "feat(landing): add motion foundation — useScrollProgress + Parallax"
```

---

## Task 2: Pointer primitives — `Tilt`, `Magnetic`, `CursorSpotlight`

**Files:**
- Modify: `components/motion.tsx` (append the three components)

- [ ] **Step 1: Append `Tilt`, `Magnetic`, and `CursorSpotlight` to `components/motion.tsx`**

Add the following at the end of the file (after `Parallax`):

```tsx
/**
 * 3D perspective tilt toward the cursor while hovered; eases back to flat on
 * leave. When `glow` is set, a warm radial light tracks the cursor behind the
 * child (reads as the card lifting off the page). Also publishes `--mx`/`--my`
 * (cursor position as %), which descendants can use for their own glows.
 */
export function Tilt({
  children,
  max = 4,
  glow = false,
  className = "",
}: {
  children: React.ReactNode;
  max?: number;
  glow?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const schedule = useRaf();
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const onMove = (e: PointerEvent) =>
      schedule(() => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width; // 0..1
        const py = (e.clientY - rect.top) / rect.height; // 0..1
        el.style.setProperty("--ry", `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--rx", `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
        el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      });
    const reset = () => {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, [max, schedule]);
  return (
    <div
      ref={ref}
      className={`group relative ${className}`}
      style={{
        transform:
          "perspective(1100px) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg))",
        transformStyle: "preserve-3d",
        transition: "transform 0.45s cubic-bezier(0.22,1,0.36,1)",
        willChange: "transform",
      }}
    >
      {glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[2rem] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
          style={{
            background:
              "radial-gradient(40% 40% at var(--mx,50%) var(--my,50%), rgba(194,103,75,0.22), transparent 70%)",
          }}
        />
      )}
      {children}
    </div>
  );
}

/** Nudges its child toward the cursor while hovered, springs back on leave. */
export function Magnetic({
  children,
  strength = 8,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const schedule = useRaf();
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced()) return;
    const onMove = (e: PointerEvent) =>
      schedule(() => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const y = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        el.style.transform = `translate(${(x * strength).toFixed(1)}px, ${(
          y * strength
        ).toFixed(1)}px)`;
      });
    const reset = () => {
      el.style.transform = "translate(0,0)";
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
    };
  }, [strength, schedule]);
  return (
    <div
      ref={ref}
      className={`inline-block ${className}`}
      style={{
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1)",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

/**
 * A soft warm radial glow that follows the cursor inside its positioned parent
 * (the hero echoing the product's "spotlight"). Rests invisible until the
 * pointer enters; fades out on leave. Must be placed as a direct child of a
 * `position: relative` host.
 */
export function CursorSpotlight({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const schedule = useRaf();
  useEffect(() => {
    const el = ref.current;
    const host = el?.parentElement;
    if (!el || !host || prefersReduced()) return;
    const onMove = (e: PointerEvent) =>
      schedule(() => {
        const rect = host.getBoundingClientRect();
        el.style.setProperty("--cx", `${e.clientX - rect.left}px`);
        el.style.setProperty("--cy", `${e.clientY - rect.top}px`);
        el.style.opacity = "1";
      });
    const onLeave = () => {
      el.style.opacity = "0";
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [schedule]);
  return (
    <div
      ref={ref}
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ${className}`}
      style={{
        background:
          "radial-gradient(26rem 26rem at var(--cx,50%) var(--cy,50%), rgba(194,103,75,0.10), rgba(15,82,74,0.06) 38%, transparent 62%)",
      }}
    />
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -Ei "motion" || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 3: Dev server still compiles**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`

- [ ] **Step 4: Commit**

```bash
git add components/motion.tsx
git commit -m "feat(landing): add Tilt, Magnetic, CursorSpotlight primitives"
```

---

## Task 3: CSS — re-enable softened ambient loops + add word-reveal

**Files:**
- Modify: `app/globals.css`

**Note:** The ambient keyframes already exist; their `animation:` declarations were stripped earlier. Re-add them at the (already-softened) opacities currently in the file. Do NOT change any opacity/color values — only add the `animation:` / `background-size:` lines.

- [ ] **Step 1: Re-enable the aurora drift**

Find:
```css
.aurora::before {
  width: 46rem; height: 46rem;
  top: -16rem; left: -12rem;
  background: radial-gradient(circle, rgba(15,82,74,0.13), transparent 65%);
}
.aurora::after {
  width: 40rem; height: 40rem;
  top: -10rem; right: -10rem;
  background: radial-gradient(circle, rgba(215,90,50,0.11), transparent 65%);
}
```
Replace with (adds only the `animation:` line in each):
```css
.aurora::before {
  width: 46rem; height: 46rem;
  top: -16rem; left: -12rem;
  background: radial-gradient(circle, rgba(15,82,74,0.13), transparent 65%);
  animation: aurora-a 24s ease-in-out infinite;
}
.aurora::after {
  width: 40rem; height: 40rem;
  top: -10rem; right: -10rem;
  background: radial-gradient(circle, rgba(215,90,50,0.11), transparent 65%);
  animation: aurora-b 28s ease-in-out infinite;
}
```

- [ ] **Step 2: Re-enable the swash pan**

Find:
```css
.swash-anim {
  background-image: linear-gradient(100deg,
    rgba(248,224,212,0.7) 0%,
    rgba(244,224,180,0.85) 55%,
    rgba(248,224,212,0.7) 100%);
}
```
Replace with:
```css
.swash-anim {
  background-image: linear-gradient(100deg,
    rgba(248,224,212,0.7) 0%,
    rgba(244,224,180,0.85) 55%,
    rgba(248,224,212,0.7) 100%);
  background-size: 200% 100%;
  animation: gradient-pan 7s linear infinite alternate;
}
```

- [ ] **Step 3: Re-enable the shimmer sweep**

Find:
```css
.shimmer-host::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
  transform: translateX(-120%);
  pointer-events: none;
}
```
Replace with (adds the `animation:` + delay only):
```css
.shimmer-host::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%);
  transform: translateX(-120%);
  animation: shimmer 5s ease-in-out infinite;
  animation-delay: 1.4s;
  pointer-events: none;
}
```

- [ ] **Step 4: Add the word-reveal keyframe + classes**

Append at the end of `app/globals.css`, BEFORE the closing `@media (prefers-reduced-motion: reduce)` block (so the reduced-motion override still wins). Insert this just above that media query:
```css
/* Word-by-word headline reveal — each word rises out of a clipped line box. */
@keyframes word-rise {
  from { transform: translateY(115%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
.word-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: bottom;
}
.word {
  display: inline-block;
  animation: word-rise 0.72s cubic-bezier(0.22, 1, 0.36, 1) both;
}
```

- [ ] **Step 5: Verify the reduced-motion guard already covers the new animations**

Confirm the existing block at the bottom of `app/globals.css` reads (it should already exist — do not duplicate):
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
```
Run: `grep -c "prefers-reduced-motion" app/globals.css`
Expected: `2` (one `@theme`-adjacent comment usage is fine; the key is the media query exists). If the media query block is missing, add the block above verbatim.

- [ ] **Step 6: Verify the dev server recompiled the stylesheet without error**

Run: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/`
Expected: `200`
Manual: reload `http://localhost:3000` — the aurora should now slowly drift and the demo titlebar should get an occasional light sweep. Palette unchanged.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css
git commit -m "feat(landing): re-enable softened ambient loops + word-reveal keyframe"
```

---

## Task 4: Wire the hero — cursor spotlight, word-reveal headline, demo tilt, magnetic CTA

**Files:**
- Modify: `components/Landing.tsx`

- [ ] **Step 1: Add the motion imports**

Find:
```tsx
import { Reveal } from "@/components/Reveal";
```
Replace with:
```tsx
import { Reveal } from "@/components/Reveal";
import { Tilt, Magnetic, Parallax, CursorSpotlight } from "@/components/motion";
```

- [ ] **Step 2: Add a `W` word-reveal helper near the other local helpers**

Find the existing helper:
```tsx
// Soft pill eyebrow — a warm wash, not a skinny line.
function Eyebrow({ children }: { children: React.ReactNode }) {
```
Insert ABOVE it:
```tsx
// One headline word that rises out of a clipped line box, on a timed delay.
function W({ children, d }: { children: React.ReactNode; d: number }) {
  return (
    <span className="word-mask">
      <span className="word" style={{ animationDelay: `${d}ms` }}>
        {children}
      </span>
    </span>
  );
}

```

- [ ] **Step 3: Drop the `CursorSpotlight` into the hero (under the aurora/dot-grid)**

Find:
```tsx
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative">
        {/* drifting aurora + faint dot-grid texture behind the hero */}
        <div className="aurora" aria-hidden />
        <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />
```
Replace with:
```tsx
      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative">
        {/* drifting aurora + faint dot-grid texture + cursor spotlight */}
        <div className="aurora" aria-hidden />
        <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />
        <CursorSpotlight />
```

- [ ] **Step 4: Replace the headline with the word-reveal version**

Find:
```tsx
            <h1
              className="animate-rise font-display mt-6 text-[3.1rem] font-semibold leading-[1.03] tracking-tight text-ink sm:text-[4.1rem]"
              style={{ animationDelay: "80ms" }}
            >
              Put your next step
              <br />
              in the{" "}
              <span className="relative whitespace-nowrap text-calm">
                <span
                  className="swash-anim absolute inset-x-[-0.14em] bottom-[0.05em] -z-10 h-[0.64em] -rotate-1 rounded-[0.3em]"
                  aria-hidden
                />
                spotlight
              </span>
              .
            </h1>
```
Replace with:
```tsx
            <h1 className="font-display mt-6 text-[3.1rem] font-semibold leading-[1.03] tracking-tight text-ink sm:text-[4.1rem]">
              <W d={120}>Put</W> <W d={185}>your</W> <W d={250}>next</W>{" "}
              <W d={315}>step</W>
              <br />
              <W d={400}>in</W> <W d={460}>the</W>{" "}
              <span className="word-mask relative whitespace-nowrap text-calm">
                <span className="word" style={{ animationDelay: "540ms" }}>
                  <span
                    className="swash-anim absolute inset-x-[-0.14em] bottom-[0.05em] -z-10 h-[0.64em] -rotate-1 rounded-[0.3em]"
                    aria-hidden
                  />
                  spotlight
                </span>
              </span>
              <span className="word" style={{ animationDelay: "560ms" }}>
                .
              </span>
            </h1>
```

- [ ] **Step 5: Wrap the primary hero CTA in `Magnetic`**

Find:
```tsx
            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <button
                type="button"
                onClick={() => tryDoc(MOCK_SBA)}
                className="group relative overflow-hidden rounded-full bg-calm px-8 py-4 text-base font-semibold text-paper shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-calm-deep hover:shadow-lift"
              >
                <span className="relative z-10">Launch the live demo →</span>
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
```
Replace with:
```tsx
            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Magnetic strength={10}>
                <button
                  type="button"
                  onClick={() => tryDoc(MOCK_SBA)}
                  className="group relative overflow-hidden rounded-full bg-calm px-8 py-4 text-base font-semibold text-paper shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-calm-deep hover:shadow-lift"
                >
                  <span className="relative z-10">Launch the live demo →</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </Magnetic>
```

- [ ] **Step 6: Wrap the live demo (and its floating card) in `Tilt`**

Find:
```tsx
          {/* live demo — the larger, calmer star of the hero */}
          <div className="animate-fade-in flex justify-center lg:justify-end" style={{ animationDelay: "320ms" }}>
            <div className="relative">
              <LiveDemo />
```
Replace with:
```tsx
          {/* live demo — the larger, calmer star of the hero */}
          <div className="animate-fade-in flex justify-center lg:justify-end" style={{ animationDelay: "320ms" }}>
            <Tilt glow max={5} className="w-full max-w-[600px]">
              <LiveDemo />
```
Then find the matching closing of that inner wrapper:
```tsx
              </div>
            </div>
          </div>

          {/* live demo — the larger, calmer star of the hero */}
```
That anchor is wrong — instead find the END of the demo block (the floating card close + the two closing divs immediately before the hero `</section>` content). Find:
```tsx
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Impact strip ────────────────────────────────────────── */}
```
This closes: float-card inner, float-card flex, float-card outer, `<div className="relative">`, demo-flex `<div>`, hero grid `<div>`, `</section>`. Replace the FIRST four closing `</div>`s' middle one (the `<div className="relative">` closer) so the structure becomes `Tilt` instead. Concretely replace:
```tsx
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
```
with:
```tsx
                  </div>
                </div>
              </div>
            </Tilt>
          </div>
        </div>
      </section>
```
(The `<div className="relative">` opening became `<Tilt ...>`, so its closing `</div>` becomes `</Tilt>`. Net: one `</div>` → `</Tilt>`, removing one level since `Tilt` replaces the wrapper.)

> Implementer note: after the edit, the demo column must read `…<Tilt glow max={5} className="w-full max-w-[600px]"> <LiveDemo/> {floating card} </Tilt>`. If the closing tags don't balance, open `components/Landing.tsx`, locate the hero demo column, and ensure exactly one `</Tilt>` closes the `<Tilt>` you opened in Step 6.

- [ ] **Step 7: Typecheck + balance check**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -Ei "Landing" || echo "CLEAN"`
Expected: `CLEAN` (a JSX imbalance shows here as a parse error referencing Landing.tsx — if so, fix the closing tags per the note in Step 6).

- [ ] **Step 8: Dev server + served-HTML assertions**

Run:
```bash
curl -s -o /dev/null -w "landing %{http_code}\n" http://localhost:3000/
html=$(curl -s http://localhost:3000/)
echo "word-reveal spans -> $(echo "$html" | grep -c 'class="word"')"
echo "old static headline gone -> $(echo "$html" | grep -c 'animate-rise font-display mt-6')"
```
Expected: `landing 200`; `word-reveal spans` ≥ `8`; `old static headline gone` = `0`.
Manual: reload the page — the headline reveals word-by-word on load; moving the cursor over the hero glides a soft warm glow and tilts the demo; the CTA leans toward the cursor.

- [ ] **Step 9: Commit**

```bash
git add components/Landing.tsx
git commit -m "feat(landing): hero — cursor spotlight, word-reveal headline, demo tilt, magnetic CTA"
```

---

## Task 5: Wire walkthrough parallax + sample-card tilt & pointer glow

**Files:**
- Modify: `components/Landing.tsx`

- [ ] **Step 1: Add `Parallax` to the walkthrough visuals in `WalkRow`**

Find:
```tsx
      <Reveal dir={reverse ? "right" : "left"} delay={120} className={`flex justify-center ${reverse ? "lg:order-1" : ""}`}>
        <div className="drift-slow relative w-full max-w-[460px]">
          <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-calm-soft/35 blur-3xl" />
          {visual}
        </div>
      </Reveal>
```
Replace with:
```tsx
      <Reveal dir={reverse ? "right" : "left"} delay={120} className={`flex justify-center ${reverse ? "lg:order-1" : ""}`}>
        <Parallax speed={26} className="relative w-full max-w-[460px]">
          <div className="drift-slow relative">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-calm-soft/35 blur-3xl" />
            {visual}
          </div>
        </Parallax>
      </Reveal>
```

- [ ] **Step 2: Wrap each sample card in `Tilt` and add a pointer-follow glow overlay**

Find:
```tsx
            {SAMPLES.map((s, idx) => (
              <Reveal key={s.key} delay={idx * 80} dir="up">
                <button
                  type="button"
                  onClick={() => tryDoc(MOCK_VARIANTS[s.key])}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 text-left shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-calm-2 hover:shadow-lift"
                >
                  {/* hover wash */}
                  <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-warm-soft/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
```
Replace with:
```tsx
            {SAMPLES.map((s, idx) => (
              <Reveal key={s.key} delay={idx * 80} dir="up" className="h-full">
                <Tilt max={6} className="h-full">
                <button
                  type="button"
                  onClick={() => tryDoc(MOCK_VARIANTS[s.key])}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 text-left shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-calm-2 hover:shadow-lift"
                >
                  {/* pointer-follow glow (reads --mx/--my from the Tilt wrapper) */}
                  <span
                    className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "radial-gradient(16rem 16rem at var(--mx,50%) var(--my,50%), rgba(194,103,75,0.10), transparent 60%)" }}
                  />
                  {/* hover wash */}
                  <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-warm-soft/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
```

- [ ] **Step 3: Close the new `Tilt` wrapper around the card**

Find (the end of the sample card button + its Reveal):
```tsx
                  <span className="relative mt-6 flex items-center gap-1.5 text-sm font-semibold text-calm">
                    Decode it
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>
              </Reveal>
            ))}
```
Replace with:
```tsx
                  <span className="relative mt-6 flex items-center gap-1.5 text-sm font-semibold text-calm">
                    Decode it
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>
                </Tilt>
              </Reveal>
            ))}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json 2>&1 | grep -Ei "Landing" || echo "CLEAN"`
Expected: `CLEAN`

- [ ] **Step 5: Dev server + assertions**

Run:
```bash
curl -s -o /dev/null -w "landing %{http_code}\n" http://localhost:3000/
html=$(curl -s http://localhost:3000/)
echo "card pointer-glow overlays -> $(echo "$html" | grep -c 'radial-gradient(16rem 16rem at var(--mx')"
```
Expected: `landing 200`; `card pointer-glow overlays` = `4` (one per sample).
Manual: scroll to the walkthrough — each visual drifts at a different rate than its text (parallax depth). Hover a sample card — it tilts toward the cursor with a warm glow tracking the pointer.

- [ ] **Step 6: Commit**

```bash
git add components/Landing.tsx
git commit -m "feat(landing): walkthrough parallax + sample-card tilt & pointer glow"
```

---

## Task 6: Reduced-motion + performance verification pass

**Files:**
- None edited unless a defect is found (then `components/motion.tsx` or `components/Landing.tsx`).

- [ ] **Step 1: Confirm every JS handler guards reduced-motion**

Run: `grep -c "prefersReduced()" components/motion.tsx`
Expected: `5` (one early-return in each of `useScrollProgress`, `Parallax`, `Tilt`, `Magnetic`, `CursorSpotlight`). If any is missing, add `if (!el || prefersReduced()) return;` to that effect.

- [ ] **Step 2: Confirm motion uses only compositor-friendly properties**

Run: `grep -nE "style.transform|setProperty|willChange|transition: \"transform" components/motion.tsx | grep -vE "translate|rotate|perspective|opacity|--" || echo "ONLY transform/opacity/vars"`
Expected: `ONLY transform/opacity/vars` (no width/height/top/left/margin being animated).

- [ ] **Step 3: Manual reduced-motion check**

Toggle OS "reduce motion" on (Windows: Settings → Accessibility → Visual effects → Animation effects OFF), hard-reload `http://localhost:3000`.
Expected: page renders fully visible and static — headline shown (not stuck translated below the line), no aurora drift, cursor produces no tilt/spotlight/parallax. Toggle back on afterward.

- [ ] **Step 4: Full typecheck (whole project, not just touched files)**

Run: `npx tsc --noEmit -p tsconfig.json && echo "TS CLEAN"`
Expected: `TS CLEAN`

- [ ] **Step 5: Final smoke**

Run: `curl -s -o /dev/null -w "landing %{http_code}\n" http://localhost:3000/`
Expected: `landing 200`
Manual final pass (motion ON): load → headline cascades word-by-word; hero cursor moves the spotlight + tilts demo; CTA is magnetic; scrolling reveals sections and parallaxes the walkthrough visuals; sample cards tilt+glow; ambient aurora/shimmer/halo breathe softly. Palette/layout identical to before.

- [ ] **Step 6: Commit (if any fixes were made in this task)**

```bash
git add -A
git commit -m "chore(landing): reduced-motion + performance verification pass"
```

---

## Self-Review (author's check against the spec)

**Spec coverage:**
- Signature cursor spotlight → Task 2 (`CursorSpotlight`) + Task 4 Step 3. ✓
- Ambient layer retuned softer → Task 3. ✓
- Page-load cascade / word-reveal headline → Task 3 (keyframe) + Task 4 (markup). ✓
- Cursor-reactive demo (tilt + glow) → Task 2 (`Tilt`) + Task 4 Step 6. ✓
- Scroll-scrubbed parallax → Task 1 (`Parallax`) + Task 5 Step 1. ✓
- Magnetic CTA → Task 2 (`Magnetic`) + Task 4 Step 5. ✓
- Pointer-follow glow on cards → Task 5 Step 2 (reuses Tilt's `--mx/--my`). ✓
- Motion primitives in `components/motion.tsx`, isolated → Task 1–2. ✓
- `Reveal.tsx` unchanged → not in any edit list. ✓
- Dependency-free → no install steps anywhere. ✓
- 60fps transform/opacity/blur only → Task 6 Step 2. ✓
- rAF-throttled, CSS-var writes, no per-frame state → Task 1–2 (`useRaf`, `setProperty`). ✓
- `prefers-reduced-motion` fallback → Task 1–2 guards + Task 3 media query + Task 6 Step 1/3. ✓
- Frozen palette/spacing/type/layout → global guardrails + no token edits in any step. ✓

**Type consistency:** Primitive names (`Parallax`, `Tilt`, `Magnetic`, `CursorSpotlight`, `useScrollProgress`) and props (`speed`, `max`, `glow`, `strength`, `className`) are identical between definition (Task 1–2), the import line (Task 4 Step 1), and all usages (Task 4–5). CSS custom properties `--mx`/`--my` are written by `Tilt` (Task 2) and read by the sample-card overlay (Task 5 Step 2) — names match.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; verification commands have explicit expected output. The only judgment call is the JSX tag-balancing in Task 4 Step 6, which includes an explicit implementer note and a typecheck gate (Step 7) to catch imbalance.

**Scope:** Single page, three files, one focused plan. No decomposition needed.
