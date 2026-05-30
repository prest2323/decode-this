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
    <div className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4 shadow-soft">
      {allDone ? (
        <div
          className="flex items-center justify-between gap-4 rounded-lg px-4 py-3 text-paper shadow-soft animate-pulse-subtle"
          style={{ background: "linear-gradient(135deg, #1c5959 0%, #0f524a 60%, #0a3a34 100%)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-none">
                {t("Ready to File!", "¡Listo para presentar!")}
              </div>
              <div className="mt-1 text-[10px] leading-none text-paper/80">
                {t("All steps completed successfully.", "Todos los pasos completados con éxito.")}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportAs("pdf")}
            className="shrink-0 rounded-lg bg-paper px-3 py-1.5 text-xs font-semibold text-calm-deep shadow-soft transition-all duration-200 hover:bg-card hover:scale-[1.03] active:scale-95"
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
            className="rounded-lg border border-line px-3.5 py-2 text-xs font-semibold text-ink-soft transition duration-200 hover:border-line-strong hover:bg-paper-2 disabled:opacity-30 disabled:hover:border-line disabled:hover:bg-transparent"
          >
            ‹ {t("Back", "Atrás")}
          </button>

          <div className="flex flex-1 flex-col gap-1.5">
            <div
              role="progressbar"
              aria-valuenow={value}
              aria-valuemin={1}
              aria-valuemax={total}
              aria-label="Walkthrough progress"
              className="h-2 w-full overflow-hidden rounded-sm bg-paper-2"
            >
              <div
                className="h-full rounded-sm bg-calm transition-all duration-500"
                style={{ width: `${(value / total) * 100}%` }}
              />
            </div>
            <div className="text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
              {t("Step", "Paso")} {value} {t("of", "de")} {total}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (active) setStatus(active.id, "done");
              next();
            }}
            className="rounded-lg bg-calm px-4 py-2 text-xs font-semibold text-paper shadow-soft transition duration-200 hover:bg-calm-deep"
          >
            {activeIndex === total - 1 ? t("Finish ✓", "Terminar ✓") : t("Next ›", "Siguiente ›")}
          </button>
        </div>
      )}
    </div>
  );
}
