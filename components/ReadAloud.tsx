// OWNER: Antigravity/Gemini #1 (Input & Voice).
// Job: speak `text` out loud in the right language using the browser's
// built-in SpeechSynthesis (free, no API). Keep the props.
// THIS IS THE DEMO MONEY MOMENT — make sure the Spanish voice works.
"use client";
import { useState } from "react";
import type { Lang } from "@/lib/types";

export default function ReadAloud({ text, lang }: { text: string; lang: Lang }) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === "es" ? "es-MX" : "en-US";
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(u);
  }

  function stop() {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }

  return (
    <button
      onClick={speaking ? stop : speak}
      className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-5 py-2 font-medium hover:bg-gray-50"
    >
      {speaking ? "⏹ Stop" : lang === "es" ? "🔊 Léemelo" : "🔊 Read it to me"}
    </button>
  );
}
