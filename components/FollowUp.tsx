// OWNER: Lead (Claude 5x #1). Voice follow-up Q&A about a decoded document.
// Ask a question (type or 🎤) → grounded answer, read aloud in your language.
"use client";
import { useState } from "react";
import type { ApiResponse, DecodeResult, Lang } from "@/lib/types";
import MicInput from "./MicInput";
import ReadAloud from "./ReadAloud";

export default function FollowUp({ context, lang }: { context: DecodeResult; lang: Lang }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer(null);
    const res = await fetch("/api/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "followup", question, lang, context }),
    });
    const r: ApiResponse = await res.json();
    if (r.ok && r.mode === "followup") setAnswer(r.result.answer);
    else if (!r.ok) setAnswer(r.error);
    setLoading(false);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-500">
        {lang === "es" ? "¿Tiene una pregunta sobre esta carta?" : "Have a question about this letter?"}
      </p>
      <div className="flex items-center gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder={lang === "es" ? "p. ej. ¿Y si no puedo pagar?" : "e.g. What if I can't pay?"}
          className="flex-1 rounded-xl border border-gray-300 bg-white p-3 text-gray-900 focus:border-black focus:outline-none"
        />
        <MicInput lang={lang} onTranscript={(t) => setQuestion(t)} />
        <button
          onClick={ask}
          disabled={loading || !question.trim()}
          className="rounded-xl bg-black px-4 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "…" : lang === "es" ? "Preguntar" : "Ask"}
        </button>
      </div>
      {answer && (
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-1 flex justify-end">
            <ReadAloud text={answer} lang={lang} />
          </div>
          <p className="whitespace-pre-wrap text-gray-800">{answer}</p>
        </div>
      )}
    </div>
  );
}
