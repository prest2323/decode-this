// OWNER: Aiden (Express UI + Demo + Polish).
// Job: show the polished text with Copy + Read-aloud. Keep the props (lang optional).
"use client";
import { useState } from "react";
import type { ExpressResult as TResult, Lang } from "@/lib/types";
import ReadAloud from "./ReadAloud";

export default function ExpressResult({ result, lang = "en" }: { result: TResult; lang?: Lang }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(result.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
          {result.kind}
        </span>
        <div className="flex items-center gap-2">
          <ReadAloud text={result.formatted} lang={lang} />
          <button
            onClick={copy}
            className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium hover:bg-gray-50"
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-lg text-gray-900">{result.formatted}</p>
      <p className="text-sm text-gray-500">{result.note}</p>
    </div>
  );
}
