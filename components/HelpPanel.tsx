"use client";
// HelpPanel — a calm how-to drawer (Michael, phase-2). Opens from the "Help" nav
// tab; explains the two tabs, the guided walkthrough, languages and export. Closes
// on backdrop click or Escape. No emojis — short line-art + plain language.
import { useEffect, type ReactNode } from "react";
import { useDoc } from "@/lib/store";

const svg = (children: ReactNode) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export default function HelpPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useDoc();
  const t = (en: string, es: string) => (lang === "es" ? es : en);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const items: { icon: ReactNode; title: [string, string]; body: [string, string] }[] = [
    {
      icon: svg(<><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>),
      title: ["Guide vs. Overview", "Guía vs. Resumen"],
      body: [
        "Guide walks you through the real document one step at a time. Overview shows your progress, a health score, and insights based on what you've entered.",
        "Guía lo lleva por el documento real paso a paso. Resumen muestra su progreso, un puntaje de estado e información según lo que ha ingresado.",
      ],
    },
    {
      icon: svg(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-3.5-3.5" /></>),
      title: ["Follow the spotlight", "Siga el foco"],
      body: [
        "Each step lights up the exact box(es) on the form. Type your answer, then press Done to move to the next step.",
        "Cada paso ilumina la(s) casilla(s) exacta(s) del formulario. Escriba su respuesta y presione Listo para continuar.",
      ],
    },
    {
      icon: svg(<><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 4v16" /></>),
      title: ["Move the guide card", "Mueva la tarjeta"],
      body: [
        "The guide card never covers a box in focus. Drag it by its top handle if you'd like it somewhere else.",
        "La tarjeta de guía nunca cubre la casilla en foco. Arrástrela por la parte superior si la quiere en otro lugar.",
      ],
    },
    {
      icon: svg(<><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>),
      title: ["Chat insight", "Chat de información"],
      body: [
        "Stuck on a step? Open Chat insight to ask anything about this document — it answers using the document itself.",
        "¿Atascado en un paso? Abra Chat de información para preguntar lo que sea sobre este documento.",
      ],
    },
    {
      icon: svg(<><path d="M12 3v12M8 11l4 4 4-4M5 21h14" /></>),
      title: ["Languages & export", "Idiomas y exportar"],
      body: [
        "Switch EN/ES any time. When you're done, export the finished document as PDF, JSON, or CSV.",
        "Cambie EN/ES en cualquier momento. Al terminar, exporte el documento como PDF, JSON o CSV.",
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t("Help", "Ayuda")}
    >
      <div className="absolute inset-0 bg-ink/30 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg animate-scale-in rounded-2xl border border-line bg-card p-6 shadow-lift">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">{t("How this works", "Cómo funciona")}</h2>
            <p className="mt-1 text-sm text-ink-soft">{t("A two-minute tour of the walkthrough.", "Un recorrido de dos minutos.")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("Close", "Cerrar")}
            className="rounded-lg p-1.5 text-ink-faint transition hover:bg-paper-2 hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>

        <ul className="mt-5 space-y-3.5">
          {items.map((it, i) => (
            <li key={i} className="flex items-start gap-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-calm-tint text-calm-deep">{it.icon}</span>
              <div>
                <div className="text-sm font-semibold text-ink">{t(it.title[0], it.title[1])}</div>
                <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{t(it.body[0], it.body[1])}</p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-calm py-2.5 text-sm font-semibold text-paper shadow-soft transition hover:bg-calm-deep"
        >
          {t("Got it", "Entendido")}
        </button>
      </div>
    </div>
  );
}
