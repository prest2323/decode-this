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
