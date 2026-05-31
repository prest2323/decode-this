"use client";
// WORKSPACE — phase-2 redesign (Michael, driving the document-page UI). No doc ->
// the marketing Landing. Doc loaded -> a full-screen document walkthrough: a nav
// bar with Home / Chat insight / Help tabs, a centered Guide | Overview switch
// under it, the document filling the screen on Guide, and the details (steps,
// health score, filled-in insights) on Overview. The page indicator lives in the
// top-right corner of the canvas.
import { useEffect, useState } from "react";
import { useDoc } from "@/lib/store";
import type { Lang } from "@/lib/types";
import Landing from "@/components/Landing";
import { Logo } from "@/components/Logo";
import NavTabs from "@/components/NavTabs";
import DocCanvas from "@/components/DocCanvas";
import Overview from "@/components/Overview";
import HelpPanel from "@/components/HelpPanel";
import ChatWidget from "@/components/ChatWidget";

type View = "guide" | "overview";

export default function Page() {
  const { doc, lang, setLang, exportAs, reset, goTo, next, prev } = useDoc();
  const [view, setView] = useState<View>("guide");
  const [helpOpen, setHelpOpen] = useState(false);

  // Arrow keys step through the walkthrough (Guide view only; ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (view !== "guide") return;
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, view]);

  if (!doc) return <Landing />;
  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <main className="bg-atmosphere flex h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-line bg-card/80 px-4 py-2.5 backdrop-blur-xl">
        <Logo size={26} withText={false} />
        <div className="min-w-0 flex-1">
          <div className="font-display truncate text-[0.95rem] font-semibold text-ink">{doc.docType[lang]}</div>
          <div className="font-mono truncate text-xs text-ink-faint">{doc.fileName}</div>
        </div>
        <NavTabs
          onHome={reset}
          onChat={() => window.dispatchEvent(new Event("decode:open-chat"))}
          onHelp={() => setHelpOpen(true)}
        />
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

      {/* Centered Guide | Overview switch, directly under the nav bar. */}
      <div className="flex items-center justify-center border-b border-line bg-card/40 px-4 py-1.5">
        <div className="inline-flex rounded-xl border border-line bg-paper-2/60 p-0.5 text-sm font-semibold">
          {(["guide", "overview"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-lg px-5 py-1.5 transition ${
                view === v ? "bg-card text-calm-deep shadow-soft" : "text-ink-soft hover:text-ink"
              }`}
            >
              {v === "guide" ? t("Guide", "Guía") : t("Overview", "Resumen")}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 px-2 pb-2 pt-1.5">
        {view === "guide" ? (
          <DocCanvas />
        ) : (
          <Overview
            onJump={(i) => {
              goTo(i);
              setView("guide");
            }}
          />
        )}
      </div>

      <ChatWidget />
      <HelpPanel open={helpOpen} onClose={() => setHelpOpen(false)} />
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
