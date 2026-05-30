"use client";
// GuideBox — the single focused card for the ACTIVE step. Floats in the largest
// free band beside the spotlight so it never covers the field. No step counter —
// just a short title, one plain line, the one flag that matters, and a big
// "Done →" button. An "Ask a question" link opens the chat (decode:open-chat).
import { useState, useEffect, useRef, useMemo, type CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import { FlagChip } from "./RiskSummary";

const GUIDE_W = 330;
const GUIDE_H = 190;

export default function GuideBox() {
  const { active, reqs, activeIndex, lang, next, prev, setStatus } = useDoc();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 640, h: 800 });

  useEffect(() => {
    const parent = containerRef.current?.parentElement;
    if (!parent) return;
    const ro = new ResizeObserver(() => setDim({ w: parent.offsetWidth, h: parent.offsetHeight }));
    ro.observe(parent);
    setDim({ w: parent.offsetWidth, h: parent.offsetHeight });
    return () => ro.disconnect();
  }, [active]);

  const style = useMemo<CSSProperties>(() => {
    if (!active) return {};
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
    const { w: W, h: H } = dim;
    const sx = spot.x * W, sy = spot.y * H, sw = spot.w * W, sh = spot.h * H;
    const space = { right: W - (sx + sw), left: sx, bottom: H - (sy + sh), top: sy };
    const order = (["right", "left", "bottom", "top"] as Array<keyof typeof space>).sort(
      (a, b) => space[b] - space[a],
    );
    const clampTop = (v: number) => Math.max(8, Math.min(v, H - GUIDE_H - 8));
    const clampLeft = (v: number) => Math.max(8, Math.min(v, W - GUIDE_W - 8));

    let pos = { left: -1, top: -1 };
    for (const side of order) {
      if (side === "right" && space.right >= GUIDE_W + 24) { pos = { left: sx + sw + 16, top: clampTop(sy) }; break; }
      if (side === "left" && space.left >= GUIDE_W + 24) { pos = { left: sx - GUIDE_W - 16, top: clampTop(sy) }; break; }
      if (side === "bottom" && space.bottom >= GUIDE_H + 24) { pos = { left: clampLeft(sx), top: sy + sh + 16 }; break; }
      if (side === "top" && space.top >= GUIDE_H + 24) { pos = { left: clampLeft(sx), top: sy - GUIDE_H - 16 }; break; }
    }
    if (pos.left < 0) {
      const best = order[0];
      if (best === "right") pos = { left: Math.max(8, W - GUIDE_W - 8), top: clampTop(sy) };
      else if (best === "left") pos = { left: 8, top: clampTop(sy) };
      else if (best === "bottom") pos = { left: clampLeft(sx), top: Math.max(8, H - GUIDE_H - 8) };
      else pos = { left: clampLeft(sx), top: 8 };
    }
    return {
      position: "absolute",
      left: `${pos.left}px`,
      top: `${pos.top}px`,
      width: `${GUIDE_W}px`,
      maxWidth: "calc(100% - 16px)",
    };
  }, [active, dim]);

  if (!active) return null;
  const isLast = activeIndex >= reqs.length - 1;
  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <div
      ref={containerRef}
      style={style}
      className="pointer-events-auto absolute z-40 rounded-2xl border border-line bg-card p-5 shadow-lift ring-1 ring-line/60 transition-all duration-300 ease-out animate-scale-in"
    >
      <h3 className="font-display text-lg font-semibold leading-snug text-ink">
        {active.title[lang]}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{active.guidance[lang]}</p>

      {active.flags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {active.flags.map((f, i) => (
            <FlagChip key={i} flag={f} lang={lang} />
          ))}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={prev}
            disabled={activeIndex === 0}
            aria-label={t("Back", "Atrás")}
            className="rounded-lg p-2 text-ink-faint transition hover:bg-paper-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("decode:open-chat"))}
            className="rounded-lg px-2.5 py-2 text-xs font-medium text-calm transition hover:bg-calm-tint"
          >
            {t("Ask a question", "Hacer una pregunta")}
          </button>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatus(active.id, "done");
            if (!isLast) next();
          }}
          className="flex items-center gap-1.5 rounded-xl bg-calm px-5 py-2.5 text-sm font-semibold text-paper shadow-soft transition-all duration-200 hover:bg-calm-deep hover:scale-[1.02] active:scale-95"
        >
          {isLast ? t("Finish", "Terminar") : t("Done", "Listo")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
    </div>
  );
}
