"use client";
// GuideBox — template owner Aiden. The floating guide-text card for the ACTIVE
// requirement. Placed in the LARGEST FREE BAND relative to the active spotlight
// so it NEVER covers the focused field (the explicit requirement). When the step
// is off-page (spotlight null), it centers over the dimmed canvas like a card.
// Rendered INSIDE the DocCanvas page box so its placement aligns with the rects.
import { useState, useEffect } from "react";
import type { CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import type { Rect } from "@/lib/types";

function place(spot: Rect | null): CSSProperties {
  // off-page step -> center it
  if (!spot) {
    return { left: "50%", top: "50%", transform: "translate(-50%,-50%)" };
  }
  const roomAbove = spot.y;
  const roomBelow = 1 - (spot.y + spot.h);
  const base: CSSProperties = { left: "50%", transform: "translateX(-50%)" };
  // sit in whichever band (above/below the spotlight) has more room
  return roomBelow >= roomAbove
    ? { ...base, top: `calc(${(spot.y + spot.h) * 100}% + 10px)` }
    : { ...base, bottom: `calc(${(1 - spot.y) * 100}% + 10px)` };
}

export default function GuideBox() {
  const { active, reqs, activeIndex, lang, next, prev, setStatus } = useDoc();
  const [minimized, setMinimized] = useState(false);

  // Auto-expand whenever active requirement changes so the user sees the new guidance
  useEffect(() => {
    setMinimized(false);
  }, [active?.id]);

  if (!active) return null;
  const isLast = activeIndex >= reqs.length - 1;

  // Render a subtle floating badge when collapsed
  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        style={place(active.spotlight)}
        className="pointer-events-auto absolute z-40 rounded border border-slate-900 bg-slate-900 px-3 py-1 text-[11px] font-bold text-white shadow hover:bg-slate-800 active:scale-95 transition-all select-none cursor-pointer"
        title="Click to expand guidelines"
      >
        ℹ️ Guidelines (Step {active.order})
      </button>
    );
  }

  return (
    <div
      style={place(active.spotlight)}
      className="pointer-events-auto absolute z-40 w-[86%] max-w-sm rounded border border-slate-250 bg-white p-4 shadow-lg text-left select-text animate-fadeIn"
    >
      {/* Top Header Row with step tag & collapse button */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-2">
        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
          Step {active.order} of {reqs.length}
        </div>
        <button
          type="button"
          onClick={() => setMinimized(true)}
          className="text-slate-400 hover:text-slate-800 text-sm font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-slate-50 transition cursor-pointer select-none"
          title="Minimize guidelines"
        >
          ×
        </button>
      </div>

      {/* Title & Guidance */}
      <h3 className="text-xs font-bold text-slate-900 leading-tight">{active.title[lang]}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500 font-medium">{active.guidance[lang]}</p>
      
      {/* Flag pills if any */}
      {active.flags.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {active.flags.map((f, i) => (
            <span key={i} className="rounded bg-slate-100 border border-slate-200/50 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {f.label[lang]}
            </span>
          ))}
        </div>
      )}

      {/* Bottom control buttons */}
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={prev}
          disabled={activeIndex === 0}
          className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 select-none cursor-pointer"
        >
          ‹ Back
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus(active.id, "done");
            if (!isLast) next();
          }}
          className="rounded bg-slate-900 px-3.5 py-1 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 select-none cursor-pointer border border-slate-950 shadow-sm"
        >
          {isLast ? "Finish ✓" : "Got it, next ›"}
        </button>
      </div>
    </div>
  );
}
