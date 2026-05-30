"use client";
// Reveal — a tiny, dependency-free scroll-animation primitive. Wraps its
// children and fades/slides them in the first time they enter the viewport,
// using IntersectionObserver + a CSS transition. Honors prefers-reduced-motion
// (renders instantly visible). Stagger sequences with the `delay` prop.
import { useEffect, useRef, useState } from "react";

type Dir = "up" | "down" | "left" | "right" | "none";

const OFFSET: Record<Dir, string> = {
  up: "translateY(34px)",
  down: "translateY(-34px)",
  left: "translateX(40px)",
  right: "translateX(-40px)",
  none: "scale(0.96)",
};

export function Reveal({
  children,
  delay = 0,
  dir = "up",
  className = "",
  once = true,
  amount = 0.18,
}: {
  children: React.ReactNode;
  delay?: number;
  dir?: Dir;
  className?: string;
  once?: boolean;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (once) io.disconnect();
        } else if (!once) {
          setShown(false);
        }
      },
      { threshold: amount, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once, amount]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : OFFSET[dir],
        filter: shown ? "blur(0)" : "blur(6px)",
        transition: `opacity 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${delay}ms, filter 0.8s ease ${delay}ms`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}
