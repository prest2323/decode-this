"use client";
// RiskSummary — template owner Aiden. The "Protect" view: the 3-sentence plain
// summary + the document's hidden-trap flags (deadlines, fees, background checks,
// legal risk) as colored chips. Reads useDoc(). Aiden makes it shine.
import { useDoc } from "@/lib/store";
import type { Flag, Lang, FlagKind } from "@/lib/types";

const STYLE: Record<FlagKind, { icon: string; cls: string }> = {
  deadline:           { icon: "⏰", cls: "bg-red-100 text-red-800 ring-red-200" },
  fee:                { icon: "💸", cls: "bg-amber-100 text-amber-800 ring-amber-200" },
  "legal-risk":       { icon: "⚖️", cls: "bg-purple-100 text-purple-800 ring-purple-200" },
  "background-check": { icon: "🔎", cls: "bg-blue-100 text-blue-800 ring-blue-200" },
  scam:               { icon: "🚩", cls: "bg-rose-100 text-rose-900 ring-rose-300" },
  tip:                { icon: "💡", cls: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
};

const PRIORITY: Record<FlagKind, number> = {
  deadline: 0,
  fee: 1,
  "legal-risk": 2,
  "background-check": 3,
  scam: 4,
  tip: 5,
};

export function FlagChip({ flag, lang }: { flag: Flag; lang: Lang }) {
  const style = STYLE[flag.kind];
  if (!style) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium ring-1 transition-all duration-200 hover:scale-105 ${style.cls}`}
    >
      <span>{style.icon}</span>
      <span>
        {flag.label[lang]}
        {flag.date ? ` · ${flag.date}` : ""}
      </span>
    </span>
  );
}

export default function RiskSummary() {
  const { doc, lang } = useDoc();
  if (!doc) return null;

  const sortedFlags = [...doc.topFlags].sort(
    (a, b) => PRIORITY[a.kind] - PRIORITY[b.kind]
  );

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-600">
        <span className="animate-pulse">🛡️</span> {lang === "es" ? "Proteger" : "Protect"}
      </div>
      <h2 className="mt-2 text-lg font-extrabold tracking-tight text-slate-900">{doc.docType[lang]}</h2>
      
      <div className="mt-3 rounded-xl bg-white/80 p-5 text-base leading-relaxed text-slate-700 shadow-inner border border-slate-100">
        {doc.summary[lang]}
      </div>

      {sortedFlags.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {lang === "es" ? "Alertas y Detalles" : "Alerts & Details"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {sortedFlags.map((f, i) => (
              <FlagChip key={i} flag={f} lang={lang} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
