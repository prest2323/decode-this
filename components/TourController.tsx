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
    <div className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
      <button
        type="button"
        onClick={prev}
        disabled={activeIndex === 0}
        className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 select-none cursor-pointer"
      >
        ‹ Back
      </button>
      
      <div className="flex-1">
        {/* Sleek, sharp monochrome progress bar */}
        <div className="h-1.5 overflow-hidden rounded-sm bg-slate-100 border border-slate-200/20">
          <div className="h-full bg-slate-900 transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1 text-center text-[10px] font-bold text-slate-500 uppercase tracking-tight">
          Step {activeIndex + 1} of {reqs.length}
        </div>
      </div>
      
      <button
        type="button"
        onClick={() => {
          if (active) setStatus(active.id, "done");
          next();
        }}
        className="rounded bg-slate-900 px-4 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 border border-slate-950 shadow-sm select-none cursor-pointer"
      >
        Next ›
      </button>
    </div>
  );
}
