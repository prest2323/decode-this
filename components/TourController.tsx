"use client";
// TourController — template owner Aiden. The bottom bar: progress + Back/Next +
// keyboard arrows that drive the tour through the requirement list. Reads useDoc().
import { useEffect } from "react";
import { useDoc } from "@/lib/store";

export default function TourController() {
  const { doc, reqs, activeIndex, next, prev, active, setStatus, lang, exportAs } = useDoc();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) {
        return; // don't hijack typing
      }
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!doc || reqs.length === 0) return null;

  const total = reqs.length;
  const value = activeIndex + 1;
  const doneCount = reqs.filter((r) => r.status === "done").length;
  const allDone = doneCount === total;

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition-all duration-300">
      {allDone ? (
        <div className="flex items-center justify-between gap-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-3 text-white shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <div className="min-w-0">
              <div className="text-xs font-bold leading-none">
                {t("Ready to File!", "¡Listo para presentar!")}
              </div>
              <div className="mt-0.5 text-[10px] text-emerald-50 leading-none">
                {t("All steps completed successfully.", "Todos los pasos completados con éxito.")}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportAs("pdf")}
            className="rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50 hover:scale-[1.03] active:scale-95 shrink-0"
          >
            📥 {t("Export Package", "Exportar paquete")}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={prev}
            disabled={activeIndex === 0}
            className="rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-slate-200 transition duration-200"
          >
            ‹ {t("Back", "Atrás")}
          </button>
          
          <div className="flex-1 flex flex-col gap-1.5">
            <div
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label="Walkthrough progress"
              className="h-2 w-full overflow-hidden rounded-full bg-slate-100 ring-1 ring-slate-200/20"
            >
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${(value / total) * 100}%` }}
              />
            </div>
            <div className="text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              {t("Step", "Paso")} {value} {t("of", "de")} {total}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (active) setStatus(active.id, "done");
              next();
            }}
            className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition duration-200"
          >
            {activeIndex === total - 1 ? t("Finish ✓", "Terminar ✓") : t("Next ›", "Siguiente ›")}
          </button>
        </div>
      )}
    </div>
  );
}
