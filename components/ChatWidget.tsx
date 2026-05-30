"use client";
// ChatWidget — template owner Aiden. A docked chat grounded in the current
// document + the step you're on. POSTs to /api/chat with { question, lang, doc,
// activeRequirementId }. Works on mock with no key. Aiden polishes the UI.
import { useRef, useState, useEffect } from "react";
import { useDoc } from "@/lib/store";
import type { ApiResponse, ChatResult, ChatRequest } from "@/lib/types";

interface Msg {
  role: "user" | "ai";
  text: string;
}

function Avatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-calm-soft text-calm">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-9 8.3 9 9 0 0 1-3.8-.7L3 20l1.3-3.8A8.38 8.38 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
        <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
      </svg>
    </span>
  );
}

export default function ChatWidget() {
  const { doc, lang, active } = useDoc();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [msgs, busy]);

  // Opened from the guide card's "Ask a question" link.
  useEffect(() => {
    const open = () => setOpen(true);
    window.addEventListener("decode:open-chat", open);
    return () => window.removeEventListener("decode:open-chat", open);
  }, []);

  if (!doc) return null;

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  const greeting = active
    ? t(
        `Ask me anything about step: "${active.title[lang]}".`,
        `Pregúntame sobre el paso: "${active.title[lang]}".`
      )
    : t(
        "Ask me about any step, a fee, a deadline, or what a term means.",
        "Pregúntame sobre cualquier paso, una tarifa, una fecha límite o qué significa un término."
      );

  const suggestions = [
    t("What's a personal guarantee?", "¿Qué es una garantía personal?"),
    t("When is this due?", "¿Cuándo vence esto?"),
    t("What fees are there?", "¿Qué tarifas hay?"),
  ];

  async function send(customQ?: string) {
    const q = (customQ || input).trim();
    if (!q || busy || !doc) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: q,
          lang,
          doc,
          activeRequirementId: active?.id ?? null,
        } satisfies ChatRequest),
      });

      const data = (await res.json()) as ApiResponse<ChatResult>;
      const answer = data.ok
        ? data.result.answer
        : t(
            "Something went wrong. Try again.",
            "Algo salió mal. Intenta de nuevo."
          );

      setMsgs((m) => [...m, { role: "ai", text: answer }]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          text: t("Connection error.", "Sin conexión."),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 rounded-lg bg-calm px-5 py-3.5 text-sm font-semibold text-paper shadow-lift transition-all duration-200 hover:-translate-y-0.5 hover:bg-calm-deep active:translate-y-0"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-9 8.3 9 9 0 0 1-3.8-.7L3 20l1.3-3.8A8.38 8.38 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" />
        </svg>
        {t("Ask a question", "Hacer una pregunta")}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-[28rem] w-[calc(100vw-2rem)] sm:w-[22rem] flex-col overflow-hidden rounded-xl border border-line bg-card shadow-lift animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line bg-paper-2/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Avatar />
          {t("Your guide", "Tu guía")}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t("Close", "Cerrar")}
          className="flex h-7 w-7 items-center justify-center rounded-md text-ink-faint transition hover:bg-paper-2 hover:text-ink"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-paper/40 p-4">
        {/* Grounded greeting */}
        <div className="flex items-start gap-2.5">
          <Avatar />
          <div className="max-w-[85%] rounded-lg rounded-tl-sm border border-line bg-card px-3.5 py-2.5 text-xs font-medium leading-relaxed text-ink-soft shadow-soft">
            {greeting}
          </div>
        </div>

        {msgs.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${isUser ? "justify-end" : ""}`}
            >
              {!isUser && <Avatar />}
              <div
                className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-xs font-medium leading-relaxed shadow-soft ${
                  isUser
                    ? "rounded-tr-sm bg-calm text-paper"
                    : "rounded-tl-sm border border-line bg-card text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-start gap-2.5">
            <Avatar />
            <div className="max-w-[60%] rounded-lg rounded-tl-sm border border-line bg-card px-4 py-3 shadow-soft">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-calm-2 [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-calm-2 [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-calm-2" />
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested question chips */}
      {!busy && (
        <div className="flex flex-wrap gap-1.5 border-t border-line bg-paper-2/40 px-3 py-2.5">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => send(s)}
              className="cursor-pointer rounded-md border border-line bg-card px-3 py-1.5 text-[10px] font-semibold text-ink-soft shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-calm-2 hover:bg-calm-tint hover:text-calm-deep"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-line bg-card p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("Type your question…", "Escriba su pregunta…")}
          disabled={busy}
          className="flex-1 rounded-lg border border-line bg-paper-2/50 px-3.5 py-2.5 text-xs text-ink outline-none transition placeholder:text-ink-faint focus:border-calm-2 focus:bg-card focus:ring-2 focus:ring-calm/15"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-calm px-4 py-2.5 text-xs font-semibold text-paper shadow-soft transition hover:bg-calm-deep disabled:opacity-40 disabled:hover:bg-calm"
        >
          {t("Send", "Enviar")}
        </button>
      </form>
    </div>
  );
}
