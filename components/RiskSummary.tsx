"use client";
// RiskSummary — template owner Aiden. The "Protect" view: the 3-sentence plain
// summary + the document's hidden-trap flags (deadlines, fees, background checks,
// legal risk) as colored chips. Reads useDoc(). Aiden makes it shine.
import type { ReactNode } from "react";
import { useDoc } from "@/lib/store";
import type { Flag, Lang, FlagKind } from "@/lib/types";

// Crisp stroke icons (no emojis) — one per flag kind, matching the app's line-art.
const svg = (children: ReactNode) => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const ICON: Record<FlagKind, ReactNode> = {
  deadline: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  fee: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.4 2.4 0 0 1 2.5-1.7c1.4 0 2.3.8 2.3 1.8 0 2.4-4.8 1.3-4.8 3.8 0 1 .9 1.9 2.5 1.9 1.2 0 2.1-.6 2.4-1.6" /></>),
  "legal-risk": svg(<><path d="M12 3v18M5 7h14M7 7l-3 6h6l-3-6zM17 7l-3 6h6l-3-6zM8 21h8" /></>),
  "background-check": svg(<><circle cx="11" cy="11" r="6" /><path d="M20 20l-3.2-3.2" /></>),
  scam: svg(<><path d="M10.3 4.3 2.5 18a1.6 1.6 0 0 0 1.4 2.4h16.2A1.6 1.6 0 0 0 21.5 18L13.7 4.3a1.6 1.6 0 0 0-2.8 0z" /><path d="M12 9v4M12 17h.01" /></>),
  tip: svg(<><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.5.4.9 1 1 1.6h5c.1-.6.5-1.2 1-1.6A6 6 0 0 0 12 3z" /></>),
};
const STYLE: Record<FlagKind, string> = {
  deadline:           "bg-alert-soft text-alert ring-alert/15",
  fee:                "bg-gold-soft text-gold ring-gold/20",
  "legal-risk":       "bg-clay-soft text-clay ring-clay/20",
  "background-check": "bg-calm-soft text-calm-deep ring-calm/15",
  scam:               "bg-alert-soft text-alert ring-alert/30",
  tip:                "bg-olive-soft text-olive ring-olive/20",
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
  const cls = STYLE[flag.kind];
  if (!cls) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[0.78rem] font-medium ring-1 transition-transform duration-200 hover:-translate-y-0.5 ${cls}`}
    >
      <span className="leading-none">{ICON[flag.kind]}</span>
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
    <section className="animate-fade-in rounded-xl border border-line bg-card p-5 shadow-soft">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-calm">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-calm-soft text-calm">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3l7 3v5c0 4.4-3 7.5-7 8.5-4-1-7-4.1-7-8.5V6l7-3z" />
            <path d="M9 12l2 2 4-4.5" />
          </svg>
        </span>
        {lang === "es" ? "Proteger" : "Protect"}
      </div>

      <h2 className="font-display mt-3 text-lg font-semibold leading-snug tracking-tight text-ink">
        {doc.docType[lang]}
      </h2>

      <p className="mt-3 rounded-lg border-l-2 border-calm-2 bg-paper-2/60 p-4 text-[0.95rem] leading-relaxed text-ink-soft">
        {doc.summary[lang]}
      </p>

      {sortedFlags.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">
            {lang === "es" ? "Cosas a tener en cuenta" : "Things to keep in mind"}
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
