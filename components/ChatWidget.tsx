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
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-amber-600"
      >
        💬 Ask about this document
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex h-[28rem] w-[22rem] max-w-[90vw] flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-bold text-slate-900">💬 Ask about this document</div>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600">
          ✕
        </button>
      </div>
      <div ref={listRef} className="flex-1 space-y-2 overflow-auto p-3">
        {msgs.length === 0 && (
          <p className="px-2 text-sm text-slate-400">
            {lang === "es"
              ? "Pregúnteme sobre cualquier paso, una tarifa, una fecha límite o qué significa un término."
              : "Ask me about any step, a fee, a deadline, or what a term means."}
          </p>
        )}
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === "user" ? "ml-auto bg-slate-900 text-white" : "bg-slate-100 text-slate-800"
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="max-w-[60%] rounded-2xl bg-slate-100 px-3 py-2 text-sm text-slate-400">…</div>
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
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
        <button
          type="button"
          onClick={send}
          disabled={busy}
          className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
