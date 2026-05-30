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
