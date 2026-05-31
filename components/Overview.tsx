"use client";
// Overview — the "details" lens (Michael, phase-2 redesign). Everything that used
// to crowd the canvas lives here instead: a readiness/health score, the full step
// list (click to jump back to the guided view, tick to complete), and plain-language
// insights derived from what the user has actually filled in. The document itself
// gets the whole screen on the Guide tab; this tab is where the thinking happens.
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useDoc } from "@/lib/store";
import { FlagChip } from "./RiskSummary";
import {
  overviewInsights,
  documentHealth,
  fetchAiInsights,
  type Insight,
  type InsightKind,
} from "@/lib/insights";

const svg = (children: ReactNode) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const KIND: Record<InsightKind, { cls: string; icon: ReactNode }> = {
  consequence: { cls: "bg-calm-tint text-calm-deep", icon: svg(<path d="M5 12h14M13 6l6 6-6 6" />) },
  risk:        { cls: "bg-alert-soft text-alert", icon: svg(<><path d="M10.3 4.3 2.5 18a1.6 1.6 0 0 0 1.4 2.4h16.2A1.6 1.6 0 0 0 21.5 18L13.7 4.3a1.6 1.6 0 0 0-2.8 0z" /><path d="M12 9v4M12 17h.01" /></>) },
  deadline:    { cls: "bg-alert-soft text-alert", icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>) },
  fee:         { cls: "bg-gold-soft text-gold", icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.4 2.4 0 0 1 2.5-1.7c1.4 0 2.3.8 2.3 1.8 0 2.4-4.8 1.3-4.8 3.8 0 1 .9 1.9 2.5 1.9 1.2 0 2.1-.6 2.4-1.6" /></>) },
  tip:         { cls: "bg-olive-soft text-olive", icon: svg(<><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.9 1 1 1.6h5c.1-.6.5-1.2 1-1.6A6 6 0 0 0 12 3z" /></>) },
  progress:    { cls: "bg-calm-soft text-calm-deep", icon: svg(<path d="M5 12l4 4 10-11" />) },
};

export default function Overview({ onJump }: { onJump?: (index: number) => void }) {
  const { doc, reqs, activeIndex, lang, setStatus, exportAs } = useDoc();
  const t = (en: string, es: string) => (lang === "es" ? es : en);

  const health = useMemo(() => documentHealth(doc), [doc]);
  const ruleInsights = useMemo(() => overviewInsights(doc), [doc]);
  const [aiInsights, setAiInsights] = useState<Insight[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  // Hybrid: real uploaded docs also get AI-written insights (mock stays rule-only).
  useEffect(() => {
    if (!doc || doc.id === "mock_sba_7a") return;
    let cancelled = false;
    const run = async () => {
      setAiLoading(true);
      const list = await fetchAiInsights(doc, lang);
      if (!cancelled) {
        setAiInsights(list);
        setAiLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [doc, lang]);

  if (!doc) return null;
  const isMock = doc.id === "mock_sba_7a";
  const insights = [...ruleInsights, ...(isMock ? [] : aiInsights)];

  return (
    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto px-1 pb-10">
      {/* Document health */}
      <section className="animate-fade-in rounded-2xl border border-line bg-card p-6 shadow-soft">
        <div className="flex items-center gap-6">
          <ReadinessRing pct={health.score} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-ink">{t("Document health", "Estado del documento")}</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">
              {health.score >= 100
                ? t("Everything's handled — you're ready to file.", "Todo listo — puede presentarlo.")
                : t("Here's where you stand and what's left.", "Esto es lo que lleva y lo que falta.")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Stat label={t("Steps done", "Pasos hechos")} value={`${health.doneSteps}/${health.totalSteps}`} />
              <Stat label={t("Fields filled", "Campos llenos")} value={health.totalRequired ? `${health.filledRequired}/${health.totalRequired}` : "—"} />
              <Stat label={t("Things to watch", "A tener en cuenta")} value={`${health.riskCount}`} />
            </div>
          </div>
        </div>
      </section>

      {/* Your steps */}
      <section className="mt-4 animate-fade-in rounded-2xl border border-line bg-card shadow-soft">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h3 className="font-display text-sm font-semibold text-ink">{t("Your steps", "Tus pasos")}</h3>
          {health.score >= 100 && (
            <button
              type="button"
              onClick={() => exportAs("pdf")}
              className="flex items-center gap-1.5 rounded-lg bg-calm px-3 py-1.5 text-xs font-semibold text-paper shadow-soft transition hover:bg-calm-deep"
            >
              {svg(<path d="M12 3v12M8 11l4 4 4-4M5 21h14" />)}
              {t("Export document", "Exportar documento")}
            </button>
          )}
        </div>
        <ol className="space-y-1 p-2.5">
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
                  onClick={() => setStatus(r.id, isDone ? "todo" : "done")}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-200 active:scale-90 ${
                    isDone ? "border-calm bg-calm text-paper" : isActive ? "border-calm-2 bg-card" : "border-line-strong bg-card hover:border-calm-2"
                  }`}
                >
                  {isDone && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11" /></svg>}
                </button>
                <button type="button" onClick={() => onJump?.(i)} className="min-w-0 flex-1 text-left">
                  <div className={`text-sm font-medium leading-snug transition-colors ${isDone ? "text-ink-faint line-through" : isActive ? "text-calm-deep" : "text-ink"}`}>
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

      {/* Insights from what you filled in */}
      <section className="mt-4 animate-fade-in rounded-2xl border border-line bg-card p-5 shadow-soft">
        <h3 className="font-display text-sm font-semibold text-ink">{t("Insights for you", "Información para usted")}</h3>
        <p className="mt-1 text-xs text-ink-faint">
          {t("Based on this document and what you've entered.", "Según este documento y lo que ha ingresado.")}
        </p>
        <ul className="mt-3 space-y-2">
          {insights.map((ins) => {
            const k = KIND[ins.kind] ?? KIND.consequence;
            return (
              <li key={ins.id} className="flex items-start gap-3 rounded-xl border border-line bg-paper-2/40 p-3">
                <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${k.cls}`}>{k.icon}</span>
                <span className="text-sm leading-relaxed text-ink-soft">
                  {ins.text[lang]}
                  {ins.source === "ai" && (
                    <span className="ml-1.5 rounded bg-calm-tint px-1.5 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide text-calm-deep align-middle">AI</span>
                  )}
                </span>
              </li>
            );
          })}
          {aiLoading && !isMock && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-ink-faint">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-calm-2" />
              {t("Reading your document for more insights…", "Analizando su documento para más información…")}
            </li>
          )}
          {insights.length === 0 && !aiLoading && (
            <li className="px-3 py-2 text-sm text-ink-faint">
              {t("Start filling in the form and tailored insights will appear here.", "Empiece a completar el formulario y aquí aparecerá información personalizada.")}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper-2/40 px-2.5 py-2 text-center">
      <div className="font-display text-base font-semibold text-ink">{value}</div>
      <div className="mt-0.5 text-[0.62rem] font-medium uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}

function ReadinessRing({ pct }: { pct: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--color-paper-2)" strokeWidth="8" />
        <circle
          cx="40" cy="40" r={r} fill="none"
          stroke={pct >= 100 ? "var(--color-calm)" : "var(--color-calm-2)"}
          strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-2xl font-bold text-ink">{pct}</span>
        <span className="text-[0.6rem] font-medium uppercase tracking-wide text-ink-faint">ready</span>
      </div>
    </div>
  );
}
