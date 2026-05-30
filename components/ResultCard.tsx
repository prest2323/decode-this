// OWNER: Sawyer (Core UI). This is where CLARITY is won.
// Make it BIG, calm, and instantly legible from across a room.
// Keep the props ({ result, lang }). Redesign the visuals however you like.
"use client";
import { useState } from "react";
import type { DecodeResult, Lang } from "@/lib/types";

const URGENCY_STYLE: Record<DecodeResult["urgency"], { label: Record<Lang, string>; cls: string }> = {
  urgent: { label: { en: "⚠️ Time-sensitive", es: "⚠️ Urgente" }, cls: "bg-red-100 text-red-700" },
  normal: { label: { en: "Informational", es: "Informativo" }, cls: "bg-gray-100 text-gray-700" },
  ignore: { label: { en: "✓ No action needed", es: "✓ No requiere acción" }, cls: "bg-green-100 text-green-700" },
  scam: { label: { en: "🚩 Looks like a scam", es: "🚩 Parece una estafa" }, cls: "bg-orange-100 text-orange-700" },
};

// Turn a raw ISO date into a human countdown — the bureaucratic text this app kills.
function formatDeadline(iso: string, lang: Lang): string {
  const d = new Date(`${iso}T00:00:00`);
  if (isNaN(d.getTime())) return iso;
  const locale = lang === "es" ? "es-MX" : "en-US";
  const nice = d.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  let rel: string;
  if (days > 1) rel = lang === "es" ? ` — faltan ${days} días` : ` — ${days} days left`;
  else if (days === 1) rel = lang === "es" ? " — falta 1 día" : " — 1 day left";
  else if (days === 0) rel = lang === "es" ? " — ¡hoy!" : " — today!";
  else rel = lang === "es" ? " — fecha vencida" : " — past due";
  return `${nice}${rel}`;
}

export default function ResultCard({ result, lang }: { result: DecodeResult; lang: Lang }) {
  const u = URGENCY_STYLE[result.urgency] ?? URGENCY_STYLE.normal;
  const [copied, setCopied] = useState(false);
  const reply = result.draftReply ? result.draftReply[lang] : null;

  function copyReply() {
    if (!reply) return;
    navigator.clipboard?.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <span className={`inline-block rounded-full px-3 py-1.5 text-sm font-bold ${u.cls}`}>
        {u.label[lang]}
        {result.deadline ? ` · ${lang === "es" ? "para el" : "by"} ${formatDeadline(result.deadline, lang)}` : ""}
      </span>

      <Section label={lang === "es" ? "Qué es esto" : "What this is"} text={result.title[lang]} big />
      <Section label={lang === "es" ? "Qué significa para usted" : "What it means for you"} text={result.meaning[lang]} />
      <Section label={lang === "es" ? "Qué hacer" : "What to do"} text={result.action[lang]} />

      {reply && (
        <div className="rounded-xl bg-gray-50 p-4">
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-500">
              {lang === "es" ? "Respuesta lista para enviar" : "Reply, ready to send"}
            </p>
            <button
              onClick={copyReply}
              className="rounded-full border border-gray-300 px-3 py-0.5 text-xs font-medium hover:bg-gray-100"
            >
              {copied ? (lang === "es" ? "✓ Copiado" : "✓ Copied") : lang === "es" ? "Copiar" : "Copy"}
            </button>
          </div>
          <p className="whitespace-pre-wrap text-gray-800">{reply}</p>
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
