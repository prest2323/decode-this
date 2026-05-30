// OWNER: Aiden (Express UI + Demo + Polish).
// Job: the "you -> world" input. A controlled textarea + language choice +
// optional audience chips + submit. Keep the existing props stable.
"use client";
import type { Lang } from "@/lib/types";
import LanguageToggle from "./LanguageToggle";

const AUDIENCES = ["my child's teacher", "my landlord", "Kern County Medi-Cal", "a government office"];

export default function ExpressInput({
  value,
  onChange,
  lang,
  onLangChange,
  onSubmit,
  loading,
  audience = "",
  onAudienceChange,
}: {
  value: string;
  onChange: (text: string) => void;
  lang: Lang;
  onLangChange: (l: Lang) => void;
  onSubmit: () => void;
  loading?: boolean;
  audience?: string;
  onAudienceChange?: (a: string) => void;
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
        className="w-full rounded-xl border border-gray-300 bg-white p-4 text-lg text-gray-900 focus:border-black focus:outline-none"
      />

      {onAudienceChange && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Who&apos;s it for?</span>
          {AUDIENCES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => onAudienceChange(audience === a ? "" : a)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                audience === a
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      )}

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
