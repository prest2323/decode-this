"use client";
// ChecklistPanel — template owner Aiden. The "Checklist" view: every Requirement
// as a step, grouped by status, with a type icon + flag hints. Click a step to
// jump the tour there (goTo). Highlights the active step. Reads useDoc().
import { useRef, useEffect } from "react";
import { useDoc } from "@/lib/store";
import type { RequirementType } from "@/lib/types";
import { FlagChip } from "./RiskSummary";

const TYPE_ICON: Record<RequirementType, string> = {
  "fill-field": "✏️",
  "gather-document": "📄",
  "external-action": "🌐",
  sign: "🖊️",
  "pay-fee": "💳",
};

export default function ChecklistPanel() {
  const { doc, reqs, activeIndex, lang, goTo, setStatus, exportAs } = useDoc();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const children = listRef.current.children;
    const activeItem = children[activeIndex] as HTMLElement;
    if (activeItem) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      activeItem.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "nearest",
      });
    }
  }, [activeIndex]);
  
  if (!doc || reqs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
        {lang === "es" ? "Cargue un documento para comenzar" : "Upload a document to begin"}
      </div>
    );
  }

  const done = reqs.filter((r) => r.status === "done").length;
  const allDone = done === reqs.length;

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <span>✅</span> {t("Checklist", "Lista de tareas")}
        </div>
        <div className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
          {done}/{reqs.length} {t("done", "completados")}
        </div>
      </div>

      {allDone && (
        <div className="mx-4 mt-4 animate-fade-in rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white shadow-md transition-all duration-300">
          <h4 className="text-sm font-extrabold flex items-center gap-1">
            <span>🎉</span> {t("You're ready to file!", "¡Listo para presentar!")}
          </h4>
          <p className="mt-1 text-xs text-emerald-50 leading-normal">
            {t(
              "Every requirement has been addressed. Export your prepared package now.",
              "Se han completado todos los requisitos. Exporte su paquete ahora."
            )}
          </p>
          <button
            type="button"
            onClick={() => exportAs("pdf")}
            className="mt-3 w-full rounded-lg bg-white px-3 py-1.5 text-center text-xs font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:bg-emerald-50 hover:scale-[1.02] active:scale-95"
          >
            📥 {t("Export Completed Package", "Exportar paquete completo")}
          </button>
        </div>
      )}

      <ol ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2 max-h-[350px] lg:max-h-none">
        {reqs.map((r, i) => {
          const isActive = i === activeIndex;
          const isDone = r.status === "done";
          return (
            <li
              key={r.id}
              className={`flex items-start gap-2.5 rounded-xl p-2 transition-all duration-200 border ${
                isActive
                  ? "ring-2 ring-indigo-500 bg-indigo-50/50 border-indigo-200"
                  : "hover:bg-slate-50/70 border-transparent"
              }`}
            >
              {/* Checkbox button */}
              <button
                type="button"
                aria-label={
                  isDone
                    ? t("Mark as todo", "Marcar como pendiente")
                    : t("Mark as done", "Marcar como completado")
                }
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus(r.id, isDone ? "todo" : "done");
                }}
                className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold shadow-sm transition-all duration-200 hover:scale-105 active:scale-90 ${
                  isDone
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-slate-300 hover:border-slate-400 bg-white"
                }`}
              >
                {isDone && "✓"}
              </button>

              {/* Requirement content button */}
              <button
                type="button"
                onClick={() => goTo(i)}
                className="flex-1 text-left min-w-0"
              >
                <div
                  className={`text-sm font-semibold leading-snug transition-colors duration-200 ${
                    isDone ? "line-through text-slate-400" : "text-slate-800"
                  }`}
                >
                  <span className="inline-block mr-1 text-base leading-none">
                    {TYPE_ICON[r.type]}
                  </span>{" "}
                  {r.title[lang]}
                </div>
                
                {r.flags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.flags.map((f, fi) => (
                      <FlagChip key={fi} flag={f} lang={lang} />
                    ))}
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
