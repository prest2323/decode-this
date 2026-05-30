"use client";
// ChatWidget — template owner Aiden. A docked chat grounded in the current
// document + the step you're on. POSTs to /api/chat with { question, lang, doc,
// activeRequirementId }. Works on mock with no key. Aiden polishes the UI.
import { useRef, useState } from "react";
import { useDoc } from "@/lib/store";
import type { ApiResponse, ChatResult } from "@/lib/types";

interface Msg {
  role: "user" | "bot";
  text: string;
}

export default function ChatWidget() {
  const { doc, lang, active } = useDoc();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  if (!doc) return null;

  async function send() {
    const q = input.trim();
    if (!q || busy || !doc) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setBusy(true);
    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang, doc, activeRequirementId: active?.id ?? null }),
      });
      const json = (await resp.json()) as ApiResponse<ChatResult>;
      const text = json.ok ? json.result.answer : json.error;
      setMsgs((m) => [...m, { role: "bot", text }]);
    } catch {
      setMsgs((m) => [...m, { role: "bot", text: "I couldn't answer just now — try again." }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() => listRef.current?.scrollTo(0, listRef.current.scrollHeight));
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-md bg-slate-900 border border-slate-950 px-5 py-3 text-xs font-bold text-white shadow-lg hover:bg-slate-800 transition active:scale-95 select-none cursor-pointer"
      >
        💬 Ask AI Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[90vw] flex-col rounded-md border border-slate-200 bg-white shadow-2xl animate-fadeIn">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-wider text-slate-800">💬 Ask Assistant</div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-slate-400 hover:text-slate-800 text-sm font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-slate-50 transition cursor-pointer select-none"
        >
          ✕
        </button>
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-auto p-3 bg-slate-50/30">
        {msgs.length === 0 && (
          <p className="px-2 text-xs font-medium text-slate-450 leading-relaxed">
            {lang === "es"
              ? "Pregúnteme sobre cualquier paso, una tarifa, una fecha límite o qué significa un término."
              : "Ask me about any step, a fee, a deadline, or what a term means."}
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded px-3 py-2 text-xs font-medium leading-relaxed ${
              m.role === "user" ? "ml-auto bg-slate-900 text-white shadow-sm" : "bg-slate-100 text-slate-800 border border-slate-200/50"
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="max-w-[15%] rounded bg-slate-100 border border-slate-200/50 px-3 py-1.5 text-xs text-slate-400 font-bold animate-pulse">…</div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-slate-100 p-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={lang === "es" ? "Escriba su pregunta…" : "Type your question…"}
          className="flex-1 rounded border border-slate-200 px-3 py-2 text-xs font-medium outline-none focus:border-slate-900 placeholder:text-slate-400"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="rounded bg-slate-900 border border-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition active:scale-95 disabled:opacity-50 select-none cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
}
