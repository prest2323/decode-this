"use client";
// ChecklistPanel — the map. Every step as a clean row; click to jump, tap the
// circle to check it off. Progress is the quiet fill bar + the satisfying ticks,
// not a "step N of M" counter. The one flag that matters rides on its step.
import { useRef, useEffect } from "react";
import { useDoc } from "@/lib/store";
import { FlagChip } from "./RiskSummary";

export default function ChecklistPanel() {
  const { doc, reqs, activeIndex, lang, goTo, setStatus, exportAs } = useDoc();
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const item = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    if (item) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      item.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }
  }, [activeIndex]);

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  if (!doc || reqs.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-2xl border border-dashed border-line-strong text-sm text-ink-faint">
        {t("Upload a document to begin", "Cargue un documento para comenzar")}
      </div>
    );
  }

  const done = reqs.filter((r) => r.status === "done").length;
  const allDone = done === reqs.length;
  const pct = Math.round((done / reqs.length) * 100);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-card shadow-soft">
      <div className="border-b border-line bg-paper-2/40 px-4 py-3.5">
        <h2 className="font-display text-sm font-semibold text-ink">{t("Your steps", "Tus pasos")}</h2>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-paper-2">
          <div
            className="h-full rounded-full bg-calm transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {allDone && (
        <div
          className="mx-3 mt-3 animate-scale-in rounded-xl p-4 text-paper shadow-soft"
          style={{ background: "linear-gradient(135deg,#1c5959 0%,#0f524a 60%,#0a3a34 100%)" }}
        >
          <div className="font-display text-sm font-semibold">
            {t("You're ready to file", "¡Listo para presentar!")}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-paper/85">
            {t("Every step is handled. Export your finished document.", "Cada paso está listo. Exporte su documento.")}
          </p>
          <button
            type="button"
            onClick={() => exportAs("pdf")}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-paper px-3 py-2 text-xs font-semibold text-calm-deep shadow-soft transition hover:bg-card"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></svg>
            {t("Export document", "Exportar documento")}
          </button>
        </div>
      )}

      <ol ref={listRef} className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2.5">
        {reqs.map((r, i) => {
          const isActive = i === activeIndex;
          const isDone = r.status === "done";
          return (
            <li
              key={r.id}
              className={`flex items-start gap-3 rounded-xl p-2.5 transition-all duration-200 ${
                isActive ? "bg-calm-tint ring-1 ring-calm/20" : "hover:bg-paper-2/60"
              }`}
            >
              <button
                type="button"
                aria-label={isDone ? t("Mark not done", "Marcar pendiente") : t("Mark done", "Marcar completado")}
                onClick={(e) => {
                  e.stopPropagation();
                  setStatus(r.id, isDone ? "todo" : "done");
                }}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                  isDone
                    ? "border-calm bg-calm text-paper"
                    : isActive
                      ? "border-calm-2 bg-card"
                      : "border-line-strong bg-card hover:border-calm-2"
                }`}
              >
                {isDone && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11" /></svg>
                )}
              </button>
              <button type="button" onClick={() => goTo(i)} className="min-w-0 flex-1 text-left">
                <div
                  className={`text-sm font-medium leading-snug transition-colors ${
                    isDone ? "text-ink-faint line-through" : isActive ? "text-calm-deep" : "text-ink"
                  }`}
                >
                  {r.title[lang]}
                </div>
                {r.flags.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
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
