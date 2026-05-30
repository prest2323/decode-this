"use client";
// GuideBox — template owner Aiden. The floating guide-text card for the ACTIVE
// requirement. Placed in the LARGEST FREE BAND relative to the active spotlight
// so it NEVER covers the focused field (the explicit requirement). When the step
// is off-page (spotlight null), it centers over the dimmed canvas like a card.
// Rendered INSIDE the DocCanvas page box so its placement aligns with the rects.
import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import { FlagChip } from "./RiskSummary";

export default function GuideBox() {
  const { active, reqs, activeIndex, lang, next, prev, setStatus } = useDoc();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ w: 640, h: 800 });

  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width && height) {
          setDimensions({ w: width, h: height });
        } else {
          setDimensions({ w: parent.offsetWidth, h: parent.offsetHeight });
        }
      }
    });

    resizeObserver.observe(parent);
    setDimensions({ w: parent.offsetWidth, h: parent.offsetHeight });

    return () => resizeObserver.disconnect();
  }, [active]);

  const style = useMemo<CSSProperties>(() => {
    if (!active) return {};

    const GUIDE_W = 320;
    const GUIDE_H = 180;
    const spot = active.spotlight;

    if (!spot) {
      return {
        position: "absolute",
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        width: `${GUIDE_W}px`,
        maxWidth: "calc(100% - 16px)",
      };
    }

    const W = dimensions.w;
    const H = dimensions.h;
    const sx = spot.x * W;
    const sy = spot.y * H;
    const sw = spot.w * W;
    const sh = spot.h * H;

    const space = {
      right: W - (sx + sw),
      left: sx,
      bottom: H - (sy + sh),
      top: sy,
    };

    const order = [...(["right", "left", "bottom", "top"] as const)].sort(
      (a, b) => space[b] - space[a]
    );

    const clampTop = (t: number) => Math.max(8, Math.min(t, H - GUIDE_H - 8));
    const clampLeft = (l: number) => Math.max(8, Math.min(l, W - GUIDE_W - 8));

    let pos = { left: 0, top: 0 };
    for (const side of order) {
      if (side === "right" && space.right >= GUIDE_W + 24) {
        pos = { left: sx + sw + 16, top: clampTop(sy) };
        break;
      }
      if (side === "left" && space.left >= GUIDE_W + 24) {
        pos = { left: sx - GUIDE_W - 16, top: clampTop(sy) };
        break;
      }
      if (side === "bottom" && space.bottom >= GUIDE_H + 24) {
        pos = { left: clampLeft(sx), top: sy + sh + 16 };
        break;
      }
      if (side === "top" && space.top >= GUIDE_H + 24) {
        pos = { left: clampLeft(sx), top: sy - GUIDE_H - 16 };
        break;
      }
    }

    // Fallback if none of the sides fit comfortably
    if (pos.left === 0 && pos.top === 0) {
      const bestSide = order[0];
      if (bestSide === "right") {
        pos = { left: Math.max(8, W - GUIDE_W - 8), top: clampTop(sy) };
      } else if (bestSide === "left") {
        pos = { left: 8, top: clampTop(sy) };
      } else if (bestSide === "bottom") {
        pos = { left: clampLeft(sx), top: Math.max(8, H - GUIDE_H - 8) };
      } else {
        pos = { left: clampLeft(sx), top: 8 };
      }
    }

    return {
      position: "absolute",
      left: `${pos.left}px`,
      top: `${pos.top}px`,
      width: `${GUIDE_W}px`,
      maxWidth: "calc(100% - 16px)",
    };
  }, [active, dimensions]);

  if (!active) return null;
  const isLast = activeIndex >= reqs.length - 1;

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <div
      ref={containerRef}
      style={style}
      className="pointer-events-auto absolute z-40 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl ring-1 ring-slate-200/50 transition-all duration-300 ease-out"
    >
      <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
        {t("Step", "Paso")} {active.order} {t("of", "de")} {reqs.length}
      </div>
      <h3 className="mt-1 text-sm font-bold leading-snug text-slate-900">
        {active.title[lang]}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-600">
        {active.guidance[lang]}
      </p>

      {active.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {active.flags.map((f, i) => (
            <FlagChip key={i} flag={f} lang={lang} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={prev}
          disabled={activeIndex === 0}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          ‹ {t("Back", "Atrás")}
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus(active.id, "done");
            if (!isLast) next();
          }}
          className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-100 transition-all duration-200 hover:bg-indigo-700 hover:scale-[1.02] hover:shadow-indigo-200 active:scale-95"
        >
          {isLast ? t("Finish ✓", "Terminar ✓") : t("Got it, next ›", "Entendido, sig. ›")}
        </button>
      </div>
    </div>
  );
}
