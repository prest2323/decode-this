"use client";
// GuideBox — the single focused card for the ACTIVE step (Aiden's component,
// phase-2 reworked by Michael). It now:
//   1. only ever sits ABOVE or BELOW the focused box — never over it;
//   2. types its guidance out like it's being written, on every step change;
//   3. reveals a one-line insight at the bottom once the text finishes;
//   4. can be dragged anywhere by its top handle.
// DocCanvas centers + zooms the focused box to the viewport center, so we place
// the card relative to that center (using the same zoom factor).
import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useDoc } from "@/lib/store";
import { FlagChip } from "./RiskSummary";
import { stepInsight } from "@/lib/insights";

const GUIDE_W = 296;
const GAP = 16;

export default function GuideBox() {
  const { active, reqs, activeIndex, lang, next, prev, setStatus } = useDoc();
  const cardRef = useRef<HTMLDivElement>(null);
  const [dim, setDim] = useState({ w: 640, h: 800 });
  const [cardH, setCardH] = useState(200);
  const [manual, setManual] = useState<{ left: number; top: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [typed, setTyped] = useState("");
  const [typingDone, setTypingDone] = useState(false);

  const fullText = active ? active.guidance[lang] : "";
  const insight = useMemo(() => stepInsight(active), [active]);

  // Measure the page box (our offset parent) and our own height for placement.
  useEffect(() => {
    const el = cardRef.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;
    const update = () => {
      setDim({ w: parent.offsetWidth, h: parent.offsetHeight });
      setCardH(el.offsetHeight);
    };
    const ro = new ResizeObserver(update);
    ro.observe(parent);
    ro.observe(el);
    update();
    return () => ro.disconnect();
  }, [active?.id]);

  // Type the guidance out — ALWAYS, every time a new card appears. The card is
  // remounted per step+language (key in DocCanvas), so typed/typingDone start fresh
  // and this runs on each step. setState happens only inside the timer callback.
  useEffect(() => {
    if (!fullText) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 2;
      if (i >= fullText.length) {
        setTyped(fullText);
        setTypingDone(true);
        window.clearInterval(id);
      } else {
        setTyped(fullText.slice(0, i));
      }
    }, 18);
    return () => window.clearInterval(id);
  }, [fullText]);

  const style = useMemo<CSSProperties>(() => {
    const base: CSSProperties = { position: "absolute", width: `${GUIDE_W}px`, maxWidth: "calc(100% - 16px)" };
    if (!active) return base;
    const { w: W, h: H } = dim;
    const cw = Math.min(GUIDE_W, W - 16);
    if (manual) return { ...base, left: `${manual.left}px`, top: `${manual.top}px` };
    const spot = active.spotlight;
    if (!spot) {
      return { ...base, left: `${Math.max(8, W / 2 - cw / 2)}px`, top: `${Math.max(8, H / 2 - cardH / 2)}px` };
    }
    // The document runs on at full size (no zoom) — place the card above/below the
    // box at its real position, centered on it, and never overlapping it.
    const sx = spot.x * W;
    const sy = spot.y * H;
    const sw = spot.w * W;
    const sh = spot.h * H;
    const left = Math.max(8, Math.min(sx + sw / 2 - cw / 2, W - cw - 8));
    const below = sy + sh + GAP;
    const above = sy - GAP - cardH;
    let top: number;
    if (below + cardH <= H - 8) top = below; // prefer below the box
    else if (above >= 8) top = above; // else above it
    else top = Math.max(8, Math.min(below, H - cardH - 8)); // last resort: clamp
    return { ...base, left: `${left}px`, top: `${top}px` };
  }, [active, dim, cardH, manual]);

  const onHandleDown = useCallback((e: ReactPointerEvent) => {
    const card = cardRef.current;
    const parent = card?.parentElement;
    if (!card || !parent) return;
    const cardRect = card.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    const offX = e.clientX - cardRect.left;
    const offY = e.clientY - cardRect.top;
    const cw = cardRect.width;
    const ch = cardRect.height;
    setDragging(true);
    const move = (ev: PointerEvent) => {
      const left = Math.max(8, Math.min(ev.clientX - parentRect.left - offX, parentRect.width - cw - 8));
      const top = Math.max(8, Math.min(ev.clientY - parentRect.top - offY, parentRect.height - ch - 8));
      setManual({ left, top });
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }, []);

  if (!active) return null;
  const isLast = activeIndex >= reqs.length - 1;
  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <div
      ref={cardRef}
      style={style}
      className={`pointer-events-auto absolute z-40 overflow-hidden rounded-2xl border border-line bg-card shadow-lift ring-1 ring-line/60 animate-scale-in ${
        dragging ? "" : "transition-[left,top] duration-300 ease-out"
      }`}
    >
      {/* Drag handle — grab the top to move the card anywhere. */}
      <div
        onPointerDown={onHandleDown}
        aria-label={t("Drag to move", "Arrastrar para mover")}
        className={`flex touch-none select-none items-center justify-center gap-1 border-b border-line/50 bg-paper-2/40 py-1 ${
          dragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <span className="h-1 w-1 rounded-full bg-line-strong" />
        <span className="h-1 w-1 rounded-full bg-line-strong" />
        <span className="h-1 w-1 rounded-full bg-line-strong" />
      </div>

      <div className="p-3.5 pt-2.5">
        <h3 className="font-display text-[0.95rem] font-semibold leading-snug text-ink">{active.title[lang]}</h3>
        <p className="mt-1.5 min-h-[1.5rem] text-[0.8rem] leading-relaxed text-ink-soft">
          {typed}
          {!typingDone && <span className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] animate-pulse bg-calm-2 align-middle" />}
        </p>

        {active.flags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {active.flags.map((f, i) => (
              <FlagChip key={i} flag={f} lang={lang} />
            ))}
          </div>
        )}

        {/* The step insight pops in at the bottom once the text finishes typing. */}
        {insight && typingDone && (
          <div className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-calm-tint/70 px-2.5 py-1.5 text-[0.72rem] leading-relaxed text-calm-deep animate-fade-in">
            <svg className="mt-0.5 shrink-0" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.9 1 1 1.6h5c.1-.6.5-1.2 1-1.6A6 6 0 0 0 12 3z" />
            </svg>
            <span>{insight[lang]}</span>
          </div>
        )}

        <div className="mt-3.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={prev}
              disabled={activeIndex === 0}
              aria-label={t("Back", "Atrás")}
              className="rounded-lg p-1.5 text-ink-faint transition hover:bg-paper-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("decode:open-chat"))}
              className="rounded-lg px-2 py-1.5 text-[0.7rem] font-medium text-calm transition hover:bg-calm-tint"
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
            className="flex items-center gap-1.5 rounded-lg bg-calm px-3.5 py-1.5 text-[0.8rem] font-semibold text-paper shadow-soft transition-all duration-200 hover:bg-calm-deep hover:scale-[1.02] active:scale-95"
          >
            {isLast ? t("Finish", "Terminar") : t("Done", "Listo")}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
