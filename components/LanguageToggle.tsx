// OWNER: Claude 5x #2 (Core UI). You may redesign freely — keep the props.
"use client";
import type { Lang } from "@/lib/types";

export default function LanguageToggle({
  lang,
  onChange,
}: {
  lang: Lang;
  onChange: (l: Lang) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-gray-300 p-1 text-sm font-medium">
      {(["en", "es"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => onChange(l)}
          className={`rounded-full px-4 py-1 transition ${
            lang === l ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          {l === "en" ? "English" : "Español"}
        </button>
      ))}
    </div>
  );
}
