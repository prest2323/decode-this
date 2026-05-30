"use client";
// GuideBox — template owner Aiden. The floating guide-text card for the ACTIVE
// requirement. Placed in the LARGEST FREE BAND relative to the active spotlight
// so it NEVER covers the focused field (the explicit requirement). When the step
// is off-page (spotlight null), it centers over the dimmed canvas like a card.
// Rendered INSIDE the DocCanvas page box so its placement aligns with the rects.
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
    ? { ...base, top: `calc(${(spot.y + spot.h) * 100}% + 12px)` }
    : { ...base, bottom: `calc(${(1 - spot.y) * 100}% + 12px)` };
}

export default function GuideBox() {
  const { active, reqs, activeIndex, lang, next, prev, setStatus } = useDoc();
  if (!active) return null;
  const isLast = activeIndex >= reqs.length - 1;

  return (
    <div
      style={place(active.spotlight)}
      className="pointer-events-auto absolute z-40 w-[86%] max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
    >
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
        Step {active.order} of {reqs.length}
      </div>
      <h3 className="mt-1 text-sm font-bold text-slate-900">{active.title[lang]}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{active.guidance[lang]}</p>
      {active.flags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {active.flags.map((f, i) => (
            <span key={i} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {f.label[lang]}
            </span>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={prev}
          disabled={activeIndex === 0}
          className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-500 disabled:opacity-40"
        >
          ‹ Back
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus(active.id, "done");
            if (!isLast) next();
          }}
          className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-amber-600"
        >
          {isLast ? "Finish ✓" : "Got it, next ›"}
        </button>
      </div>
    </div>
  );
}
