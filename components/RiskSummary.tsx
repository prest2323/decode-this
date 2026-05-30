"use client";
// RiskSummary — template owner Aiden. The "Protect" view: the 3-sentence plain
// summary + the document's hidden-trap flags (deadlines, fees, background checks,
// legal risk) as colored chips. Reads useDoc(). Aiden makes it shine.
import { useDoc } from "@/lib/store";
import type { FlagKind } from "@/lib/types";

const FLAG: Record<FlagKind, { icon: string; cls: string }> = {
  deadline: { icon: "⏰", cls: "bg-rose-50 text-rose-700 ring-rose-250/30" },
  fee: { icon: "💵", cls: "bg-slate-100 text-slate-800 ring-slate-250/40" },
  "background-check": { icon: "🔎", cls: "bg-indigo-50 text-indigo-700 ring-indigo-250/30" },
  "legal-risk": { icon: "⚖️", cls: "bg-rose-50 text-rose-700 ring-rose-250/30" },
  scam: { icon: "🚩", cls: "bg-rose-50 text-rose-700 ring-rose-250/30" },
  tip: { icon: "💡", cls: "bg-sky-50 text-sky-750 ring-sky-250/30" },
};

export default function RiskSummary() {
  const { doc, lang } = useDoc();
  if (!doc) return null;
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 mb-2">
        🛡️ Protect
      </div>
      <h2 className="text-sm font-bold text-slate-900 tracking-tight">{doc.docType[lang]}</h2>
      <p className="mt-2 text-xs leading-relaxed text-slate-500 font-medium">{doc.summary[lang]}</p>
      {doc.topFlags.length > 0 && (
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {doc.topFlags.map((f, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[11px] font-bold ring-1 ${FLAG[f.kind].cls}`}
            >
              <span className="text-xs shrink-0 select-none">{FLAG[f.kind].icon}</span>
              {f.label[lang]}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
