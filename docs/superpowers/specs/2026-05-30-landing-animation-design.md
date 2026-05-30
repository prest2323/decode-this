# Landing page — motion overhaul design

**Date:** 2026-05-30
**Component:** `components/Landing.tsx` (marketing home, shown before a doc is loaded)
**Goal:** Make the landing page feel richly, "overly" animated and premium **without** changing the soft, minimal "Warm Paper & Calm" look. Overdesign the *behavior*, not the *form*.

## Guiding principle

> The palette, spacing, typography, and layout stay exactly as they are. All the "overdesign" lives in **motion** — both always-on ambient loops and input-driven (scroll + cursor) choreography, layered together.

Constraints:
- **Dependency-free.** No `motion`/`framer-motion` (team rules forbid new deps). IntersectionObserver, scroll/pointer listeners, CSS variables, and CSS transitions/keyframes only.
- **60fps.** Animate `transform`, `opacity`, `filter: blur` only. No layout-affecting properties in motion paths. `will-change` on moving layers.
- **No React re-renders on mouse move.** Pointer/scroll handlers are `requestAnimationFrame`-throttled and write to CSS custom properties (`--mx`, `--my`, `--sp`, etc.) on a ref'd element — never `setState` per frame.
- **`prefers-reduced-motion`.** When set: all ambient loops paused, input-driven transforms disabled, every revealed element renders static + fully visible. Already partially handled in `globals.css`; extend to the new primitives.

## Signature concept — cursor-tracked spotlight

The product puts your next step "in the spotlight." The hero echoes this: a soft warm radial glow (`CursorSpotlight`) follows the cursor under the hero content. It is a blurred, low-opacity wash (terracotta+eucalyptus mix) — atmospheric, never a hard effect. This is the one bold, thematic move that makes the page feel authored. On touch/reduced-motion it rests centered and static.

## Motion architecture

New file `components/motion.tsx` — a set of small, isolated, reusable client primitives. Each has one job, a clear prop interface, and no dependency on the others.

| Primitive | Purpose | Interface (props) |
|---|---|---|
| `Reveal` | One-shot entrance (fade + slide + de-blur) when scrolled into view. **Already exists in `components/Reveal.tsx` — keep it there unchanged** and import it alongside the new primitives. (Decision: do not move it; avoids churn and a broken import surface.) | `children, delay?, dir?, className?, once?, amount?` |
| `Parallax` | Translate child on the Y axis as a fraction of scroll progress through the viewport. Used for walkthrough visuals drifting vs. their text. | `children, speed?` (px of travel, default ~30), `className?` |
| `Tilt` | 3D perspective tilt + optional pointer-follow glow toward the cursor while hovered; eases back to flat on leave. Wraps the hero demo and (lightly) sample cards. | `children, max?` (deg, default 4), `glow?` (bool), `className?` |
| `Magnetic` | Element nudges toward the cursor within a small radius (translate), springs back on leave. Wraps the primary CTA. | `children, strength?` (px, default 8), `className?` |
| `CursorSpotlight` | Absolutely-positioned warm radial glow that follows the pointer inside its nearest positioned ancestor. Hero only. | `className?` |
| `useScrollProgress` | rAF-throttled hook returning a ref + writing scroll progress (0..1 through viewport) to a CSS var. Backing for `Parallax`. | `(ref, varName?) ⇒ void` |

`Landing.tsx` composes these. No primitive imports another except `Parallax` using `useScrollProgress`.

## Two layers of motion

### Layer 1 — Ambient (always-on, retuned softer)
Lives in `globals.css`. Restore/keep but lower amplitude & opacity so it whispers:
- `aurora` drift (re-add the `animation:` on `.aurora::before/::after`, 22s/26s, low opacity — values already softened).
- `shimmer` sweep on demo titlebar + walkthrough frames (re-add `animation:` on `.shimmer-host::after`, slow, delayed).
- `swash-anim` gentle gradient pan under "spotlight" (re-add `background-size` + `animation`).
- `halo-breathe` on the live spotlight (kept).
- `floaty-soft` / `drift-slow` on float card + CTA blobs (kept).

### Layer 2 — Input-driven choreography
- **Page-load cascade (hero):** nav → kicker → headline (word-by-word line-mask reveal via a new `word-rise` keyframe + per-word `animation-delay`) → paragraph → buttons → trust pills → demo (`Tilt`, scales/tilts in) → float card pop. Staggered with existing `animate-rise`/delays + the new word reveal.
- **Hero demo:** wrapped in `Tilt` (`glow`) — tilts toward cursor, glow follows.
- **Hero CTA:** wrapped in `Magnetic`.
- **Hero background:** `CursorSpotlight`.
- **Walkthrough rows:** each visual wrapped in `Parallax` (drifts vs. its text on scroll). Keep the existing `Reveal` left/right entrances.
- **Sample cards:** light `Tilt` + pointer-follow radial glow (CSS var `--mx/--my` → a `radial-gradient` overlay). Keep existing staggered `Reveal`.

## Per-section summary

- **Nav:** unchanged (already rises in).
- **Hero:** `CursorSpotlight` + word-reveal headline + `Tilt` demo + `Magnetic` CTA + ambient aurora/dot-grid (dot-grid gets a faint scroll parallax). Heaviest section.
- **Impact strip:** keep staggered `Reveal`; numbers optionally count-up on first view (nice-to-have, YAGNI if it complicates).
- **Walkthrough ×3:** `Parallax` visuals + existing reveals + ambient shimmer on frames.
- **Sample gallery:** `Tilt` + pointer glow + existing reveals.
- **Bring-your-own + Closing CTA:** existing reveals + ambient drift blobs.

## Files touched

- `components/motion.tsx` — **new.** The primitives above.
- `components/Reveal.tsx` — keep (or re-export from `motion.tsx`). No behavior change.
- `components/Landing.tsx` — compose the new primitives; word-reveal headline markup.
- `components/LiveDemo.tsx` — minor: ensure it sits cleanly inside `Tilt` (no conflicting transforms); ambient shimmer already present.
- `app/globals.css` — re-enable softened ambient `animation:` declarations; add `word-rise` keyframe + `.cursor-spotlight` styling + reduced-motion guards for new classes.

## Non-goals (YAGNI)

- No scroll-jacking / pinned sections / horizontal scroll.
- No canvas/WebGL/particle engine.
- No new fonts, colors, or layout changes.
- No animation library.
- Count-up numbers only if trivial; drop otherwise.

## Success criteria

1. Page loads with a clear, staggered choreographed entrance (headline reveals word-by-word).
2. Moving the cursor over the hero visibly moves the spotlight glow and tilts the demo.
3. Scrolling shows parallax depth in the walkthrough visuals and one-shot reveals per section.
4. Sample cards react to the cursor (tilt + glow).
5. Palette, spacing, type, and layout are unchanged from the current soft-minimal design.
6. `prefers-reduced-motion: reduce` yields a fully static, fully visible, correct page.
7. No new dependencies; `tsc` clean; 60fps (transform/opacity/filter only).
