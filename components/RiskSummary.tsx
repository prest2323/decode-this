"use client";
// RiskSummary — template owner Aiden. The "Protect" view: the 3-sentence plain
// summary + the document's hidden-trap flags (deadlines, fees, background checks,
// legal risk) as colored chips. Reads useDoc(). Aiden makes it shine.
import { useDoc } from "@/lib/store";
import type { FlagKind } from "@/lib/types";

const FLAG: Record<FlagKind, { icon: string; cls: string }> = {
  deadline: { icon: "⏰", cls: "bg-red-50 text-red-700 ring-red-200" },
  fee: { icon: "💵", cls: "bg-amber-50 text-amber-800 ring-amber-200" },
  "background-check": { icon: "🔎", cls: "bg-violet-50 text-violet-700 ring-violet-200" },
  "legal-risk": { icon: "⚖️", cls: "bg-orange-50 text-orange-700 ring-orange-200" },
  scam: { icon: "🚩", cls: "bg-red-50 text-red-700 ring-red-200" },
  tip: { icon: "💡", cls: "bg-sky-50 text-sky-700 ring-sky-200" },
};

export default function RiskSummary() {
  const { doc, lang } = useDoc();
  if (!doc) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-semibold uppercase tracking-wide text-amber-600">
        🛡️ Protect
      </div>
      <h2 className="mt-1 text-base font-bold text-slate-900">{doc.docType[lang]}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">{doc.summary[lang]}</p>
      {doc.topFlags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {doc.topFlags.map((f, i) => (
            <span
              key={i}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${FLAG[f.kind].cls}`}
            >
              <span>{FLAG[f.kind].icon}</span>
              {f.label[lang]}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
