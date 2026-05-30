"use client";
// WORKSPACE — owned by Preston (Lead). Wires every teammate's component through
// useDoc() with minimal prop threading. No doc -> the upload hero; doc loaded ->
// the three-lens workspace: Protect + Checklist (left), the guided DocCanvas +
// TourController (center), and the floating ChatWidget. Don't put visual polish
// here — that lives in the components.
import { useDoc } from "@/lib/store";
import type { Lang } from "@/lib/types";
import Uploader from "@/components/Uploader";
import RiskSummary from "@/components/RiskSummary";
import ChecklistPanel from "@/components/ChecklistPanel";
import DocCanvas from "@/components/DocCanvas";
import TourController from "@/components/TourController";
import ChatWidget from "@/components/ChatWidget";

export default function Page() {
  const { doc, lang, setLang, exportAs, reset } = useDoc();

  if (!doc) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-5 py-10">
        <header className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Decode This</h1>
          <p className="mt-2 max-w-md text-slate-500">
            Drop in a scary, complex document — a loan application, a benefits form — and we&apos;ll
            break it down and hold your hand through every step.
          </p>
        </header>
        <Uploader />
      </main>
    );
  }

  return (
    <main className="flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
        <button
          type="button"
          onClick={reset}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          ← New
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-slate-900">{doc.docType[lang]}</div>
          <div className="truncate text-xs text-slate-400">{doc.fileName}</div>
        </div>
        <LangToggle lang={lang} onChange={setLang} />
        <div className="hidden items-center gap-1 sm:flex">
          {(["pdf", "json", "csv"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => exportAs(f)}
              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 lg:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col gap-3">
          <RiskSummary />
          <ChecklistPanel />
        </aside>
        <section className="flex min-h-0 flex-col gap-3">
          <div className="min-h-0 flex-1">
            <DocCanvas />
          </div>
          <TourController />
        </section>
      </div>

      <ChatWidget />
    </main>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-slate-300 text-xs font-semibold">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`px-3 py-1 ${lang === l ? "bg-slate-900 text-white" : "text-slate-600"}`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
