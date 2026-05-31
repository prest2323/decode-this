"use client";
// NavTabs — the embedded nav-bar tabs (Michael, phase-2): Home, Chat insight, Help.
// Sits left of the EN/ES toggle. These are actions, not routes: Home returns to the
// upload screen, Chat insight opens the assistant, Help opens the how-to drawer.
import type { ReactNode } from "react";
import { useDoc } from "@/lib/store";

const svg = (children: ReactNode) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

export default function NavTabs({
  onHome,
  onChat,
  onHelp,
}: {
  onHome: () => void;
  onChat: () => void;
  onHelp: () => void;
}) {
  const { lang } = useDoc();
  const t = (en: string, es: string) => (lang === "es" ? es : en);

  const tabs: { key: string; label: string; icon: ReactNode; onClick: () => void }[] = [
    { key: "home", label: t("Home", "Inicio"), icon: svg(<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />), onClick: onHome },
    { key: "chat", label: t("Chat insight", "Chat"), icon: svg(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />), onClick: onChat },
    { key: "help", label: t("Help", "Ayuda"), icon: svg(<><circle cx="12" cy="12" r="9" /><path d="M9.5 9.2a2.6 2.6 0 0 1 5 .9c0 1.7-2.5 2.1-2.5 3.9M12 17h.01" /></>), onClick: onHelp },
  ];

  return (
    <nav className="hidden items-center gap-0.5 rounded-xl border border-line bg-paper-2/60 p-0.5 md:flex">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={tab.onClick}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-card hover:text-calm-deep hover:shadow-soft"
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
