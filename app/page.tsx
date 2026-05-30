"use client";
// WORKSPACE — owned by Preston (Lead). No doc -> the marketing Landing; doc
// loaded -> a calm two-column walkthrough: the checklist (the map) on the left,
// the document + spotlight + one focused guide card in the center, and a quiet
// "Ask" chat. No Protect column, no step counter — just one step at a time.
import { useEffect } from "react";
import { useDoc } from "@/lib/store";
import type { Lang } from "@/lib/types";
import Landing from "@/components/Landing";
import { Logo } from "@/components/Logo";
import ChecklistPanel from "@/components/ChecklistPanel";
import DocCanvas from "@/components/DocCanvas";
import ChatWidget from "@/components/ChatWidget";

export default function Page() {
  const { doc, lang, setLang, exportAs, reset, next, prev } = useDoc();

  // Arrow keys step through the walkthrough (ignored while typing in a field).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!doc) return <Landing />;

  return (
    <main className="bg-atmosphere flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-card/80 px-4 py-2.5 backdrop-blur-xl">
        <Logo size={26} withText={false} />
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:border-line-strong hover:bg-paper-2 hover:text-ink"
        >
          ← New
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-[0.95rem] font-semibold text-ink">
            {doc.docType[lang]}
          </div>
          <div className="font-mono truncate text-xs text-ink-faint">{doc.fileName}</div>
        </div>
        <LangToggle lang={lang} onChange={setLang} />
        <div className="hidden items-center gap-1 sm:flex">
          {(["pdf", "json", "csv"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => exportAs(f)}
              className="rounded-lg border border-line px-2.5 py-1.5 text-xs font-medium text-ink-soft transition hover:border-calm-2 hover:bg-calm-tint hover:text-calm-deep"
            >
              {f.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 p-4 lg:grid-cols-[300px_1fr]">
        <aside className="hidden min-h-0 flex-col lg:flex">
          <ChecklistPanel />
        </aside>
        <section className="min-h-0">
          <DocCanvas />
        </section>
      </div>

      <ChatWidget />
    </main>
  );
}

function LangToggle({ lang, onChange }: { lang: Lang; onChange: (l: Lang) => void }) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-line bg-paper-2 p-0.5 text-xs font-semibold">
      {(["en", "es"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          className={`rounded-md px-3 py-1 transition ${
            lang === l ? "bg-calm text-paper shadow-soft" : "text-ink-soft hover:text-ink"
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
