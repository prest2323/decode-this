"use client";
// TourController — template owner Aiden. The bottom bar: progress + Back/Next +
// keyboard arrows that drive the tour through the requirement list. Reads useDoc().
import { useEffect } from "react";
import { useDoc } from "@/lib/store";

export default function TourController() {
  const { reqs, activeIndex, next, prev, active, setStatus } = useDoc();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return; // don't hijack typing
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (reqs.length === 0) return null;
  const pct = Math.round(((activeIndex + 1) / reqs.length) * 100);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5">
      <button
        type="button"
        onClick={prev}
        disabled={activeIndex === 0}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-40"
      >
        ‹ Back
      </button>
      <div className="flex-1">
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-center text-xs text-slate-500">
          Step {activeIndex + 1} of {reqs.length}
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          if (active) setStatus(active.id, "done");
          next();
        }}
        className="rounded-lg bg-slate-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-slate-700"
      >
        Next ›
      </button>
    </div>
  );
}
