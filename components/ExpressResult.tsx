// OWNER: Antigravity/Gemini #2 (Express UI + Demo + Polish).
// Job: show the polished text with a Copy button. Keep the props.
"use client";
import { useState } from "react";
import type { ExpressResult as TResult } from "@/lib/types";

export default function ExpressResult({ result }: { result: TResult }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(result.formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
          {result.kind}
        </span>
        <button onClick={copy} className="rounded-full border border-gray-300 px-4 py-1 text-sm font-medium hover:bg-gray-50">
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="whitespace-pre-wrap text-lg text-gray-900">{result.formatted}</p>
      <p className="text-sm text-gray-500">{result.note}</p>
    </div>
  );
}
