// OWNER: Antigravity/Gemini #1 (Input & Voice).
// Job: let the user SPEAK their messy thought; convert speech -> text using
// the browser Web Speech API (webkitSpeechRecognition) and call onTranscript.
// Keep the props. Falls back silently if the browser doesn't support it
// (the user can still type in ExpressInput).
"use client";
import { useRef, useState } from "react";
import type { Lang } from "@/lib/types";

export default function MicInput({
  lang,
  onTranscript,
}: {
  lang: Lang;
  onTranscript: (text: string) => void;
}) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<any>(null);

  function toggle() {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) {
      alert("Voice input isn't supported in this browser — please type instead.");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const rec = new SR();
    rec.lang = lang === "es" ? "es-MX" : "en-US";
    rec.interimResults = false;
    rec.onresult = (e: any) => onTranscript(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 font-medium ${
        listening ? "bg-red-600 text-white" : "border border-gray-300 hover:bg-gray-50"
      }`}
    >
      {listening ? "● Listening…" : lang === "es" ? "🎤 Hablar" : "🎤 Speak"}
    </button>
  );
}
