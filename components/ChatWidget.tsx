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
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.03] active:scale-95 transition-all duration-200"
      >
        <span>💬</span> {t("Ask about this document", "Preguntar sobre este documento")}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex h-[28rem] w-[calc(100vw-2rem)] sm:w-[22rem] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <span>💬</span> {t("AI Assistant", "Asistente IA")}
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto p-4 bg-slate-50/20"
      >
        {/* Grounded Greeting */}
        <div className="flex items-start gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px]">
            🤖
          </span>
          <div className="max-w-[85%] rounded-2xl bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm border border-slate-100 leading-relaxed">
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
              {!isUser && (
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px]">
                  🤖
                </span>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                  isUser
                    ? "bg-slate-950 text-white rounded-tr-none font-medium"
                    : "bg-white text-slate-800 border border-slate-150 rounded-tl-none font-medium"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}

        {busy && (
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px]">
              🤖
            </span>
            <div className="max-w-[60%] rounded-2xl bg-white px-4 py-2.5 text-xs text-slate-400 shadow-sm border border-slate-100">
              <span className="flex gap-1 items-center">
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]"></span>
                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested question chips */}
      {!busy && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-slate-100/60 bg-slate-50/30">
          {suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => send(s)}
              className="rounded-full border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 px-3 py-1 text-[10px] font-bold text-slate-600 hover:text-indigo-700 shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer"
            >
              💡 {s}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="flex items-center gap-2 border-t border-slate-100 p-3 bg-white rounded-b-2xl"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("Type your question…", "Escriba su pregunta…")}
          disabled={busy}
          className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 bg-slate-50/50 focus:bg-white transition"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
        >
          {t("Send", "Enviar")}
        </button>
      </form>
    </div>
  );
}
