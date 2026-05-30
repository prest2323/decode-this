// OWNER: Claude 5x #2 (Core UI). This is where CLARITY is won.
// Make it BIG, calm, and instantly legible from across a room.
// Keep the props ({ result, lang }). Redesign the visuals however you like.
"use client";
import type { DecodeResult, Lang } from "@/lib/types";

const URGENCY_STYLE: Record<DecodeResult["urgency"], { label: string; cls: string }> = {
  urgent: { label: "⚠️ Time-sensitive", cls: "bg-red-100 text-red-700" },
  normal: { label: "Informational", cls: "bg-gray-100 text-gray-700" },
  ignore: { label: "✓ No action needed", cls: "bg-green-100 text-green-700" },
  scam: { label: "🚩 Looks like a scam", cls: "bg-orange-100 text-orange-700" },
};

export default function ResultCard({ result, lang }: { result: DecodeResult; lang: Lang }) {
  const u = URGENCY_STYLE[result.urgency];
  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <span className={`inline-block rounded-full px-3 py-1 text-sm font-semibold ${u.cls}`}>
        {u.label}
        {result.deadline ? ` · by ${result.deadline}` : ""}
      </span>

      <Section label={lang === "es" ? "Qué es esto" : "What this is"} text={result.title[lang]} big />
      <Section label={lang === "es" ? "Qué significa para usted" : "What it means for you"} text={result.meaning[lang]} />
      <Section label={lang === "es" ? "Qué hacer" : "What to do"} text={result.action[lang]} />

      {result.draftReply && (
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="mb-1 text-sm font-semibold text-gray-500">
            {lang === "es" ? "Respuesta lista para enviar" : "Reply, ready to send"}
          </p>
          <p className="whitespace-pre-wrap text-gray-800">{result.draftReply}</p>
        </div>
      )}
    </div>
  );
}

function Section({ label, text, big }: { label: string; text: string; big?: boolean }) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className={`mt-1 text-gray-900 ${big ? "text-2xl font-bold" : "text-lg"}`}>{text}</p>
    </div>
  );
}
