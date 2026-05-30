"use client";
// GuideBox — template owner Aiden. The static, dedicated guide-text panel.
// Rendered at a fixed location in the workspace so it never covers the canvas fields.
import { useDoc } from "@/lib/store";

export default function GuideBox() {
  const { active, reqs, activeIndex, lang, next, prev, setStatus } = useDoc();

  if (!active) return null;
  const isLast = activeIndex >= reqs.length - 1;

  return (
    <div className="w-full bg-[#252526] border border-[#3c3c3c] p-4 text-left select-text animate-fadeIn flex flex-col gap-3">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-[#3c3c3c] pb-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#858585]">
          Requirement {active.order} of {reqs.length}
        </div>
        <div className="text-[10px] font-bold text-[#007acc] uppercase">
          {active.difficulty.toUpperCase()} STEP
        </div>
      </div>

      {/* Title & Guidance */}
      <div>
        <h3 className="text-sm font-bold text-white leading-tight">{active.title[lang]}</h3>
        <p className="mt-2 text-xs leading-relaxed text-[#cccccc] font-medium">{active.guidance[lang]}</p>
      </div>

      {/* Flag chips if present */}
      {active.flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {active.flags.map((f, i) => (
            <span
              key={i}
              className="rounded-sm bg-[#2d2d2d] border border-[#3c3c3c] px-2 py-0.5 text-[9px] font-bold text-[#f48771]"
            >
              {f.label[lang]}
            </span>
          ))}
        </div>
      )}

      {/* Navigation and Action Controls */}
      <div className="flex items-center justify-between border-t border-[#3c3c3c] pt-3 mt-1">
        <button
          type="button"
          onClick={prev}
          disabled={activeIndex === 0}
          className="rounded-sm border border-[#3c3c3c] bg-[#2d2d2d] hover:bg-[#3e3e3f] px-3 py-1.5 text-xs font-bold text-[#cccccc] disabled:opacity-30 disabled:pointer-events-none select-none cursor-pointer"
        >
          ‹ Back
        </button>
        <button
          type="button"
          onClick={() => {
            setStatus(active.id, "done");
            if (!isLast) next();
          }}
          className="rounded-sm bg-[#007acc] hover:bg-[#1a8ad4] px-4 py-1.5 text-xs font-bold text-white transition active:scale-98 select-none cursor-pointer border border-[#007acc]/80 shadow-sm"
        >
          {isLast ? "Complete ✓" : "Got it, next ›"}
        </button>
      </div>
    </div>
  );
}
