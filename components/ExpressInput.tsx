// OWNER: Antigravity/Gemini #2 (Express UI + Demo + Polish).
// Job: the "you -> world" input. A controlled textarea + language choice +
// submit. Keep the props. (The mic button is placed next to this by page.tsx.)
"use client";
import type { Lang } from "@/lib/types";
import LanguageToggle from "./LanguageToggle";

export default function ExpressInput({
  value,
  onChange,
  lang,
  onLangChange,
  onSubmit,
  loading,
}: {
  value: string;
  onChange: (text: string) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  onSubmit: () => void;
  loading?: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-500">
        Say it however it comes out — we&apos;ll turn it into the right words.
      </p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="e.g. my son is sick, can't go to school, don't know how to tell the teacher..."
        className="w-full rounded-xl border border-gray-300 p-4 text-lg focus:border-black focus:outline-none"
      />
      <div className="flex items-center justify-between">
        <LanguageToggle lang={lang} onChange={onLangChange} />
        <button
          disabled={loading || !value.trim()}
          onClick={onSubmit}
          className="rounded-2xl bg-black px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Working…" : "Give me the words →"}
        </button>
      </div>
    </div>
  );
}
