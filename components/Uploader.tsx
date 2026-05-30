"use client";
// Uploader — template owner Sawyer. Drag/drop or pick a PDF/image -> POST
// /api/analyze -> loadDoc(result). Also a one-click "Try the SBA sample" that
// loads the mock instantly (network-proof hero on stage). Sawyer makes it pretty.
import { useCallback, useRef, useState } from "react";
import { useDoc } from "@/lib/store";
import { MOCK_DOC } from "@/lib/mock";
import type { ApiResponse, DocumentModel } from "@/lib/types";

export default function Uploader() {
  const { loadDoc } = useDoc();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(new Error("read failed"));
          r.readAsDataURL(file);
        });
        const resp = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, file: dataUrl, mime: file.type }),
        });
        const json = (await resp.json()) as ApiResponse<DocumentModel>;
        if (json.ok) loadDoc(json.result);
        else setError(json.error);
      } catch {
        setError("Something went wrong reading that file. Try the sample to keep going.");
      } finally {
        setLoading(false);
      }
    },
    [loadDoc],
  );

  return (
    <div className="mx-auto w-full max-w-xl text-center">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) analyze(f);
        }}
        onClick={() => inputRef.current?.click()}
        className={`group cursor-pointer rounded-xl border-2 border-dashed p-12 shadow-soft transition-all duration-300 ${
          drag
            ? "border-calm bg-calm-tint scale-[1.01]"
            : "border-line-strong bg-card hover:border-calm-2 hover:bg-calm-tint/50"
        }`}
      >
        <span
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-lg transition-colors duration-300 ${
            drag ? "bg-calm text-paper" : "bg-calm-soft text-calm group-hover:bg-calm group-hover:text-paper"
          }`}
        >
          {loading ? (
            <svg className="h-7 w-7 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.25" />
              <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3v5h5" />
              <path d="M7 3h7l5 5v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
              <path d="M12 11v6M9 14l3-3 3 3" />
            </svg>
          )}
        </span>
        <p className="font-display mt-5 text-xl font-semibold text-ink">
          {loading ? "Reading your document…" : "Drop a document here"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          PDF or image. We&apos;ll break it down and walk you through every step —
          gently.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyze(f);
          }}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-alert/30 bg-alert-soft p-3 text-sm text-alert">
          {error}
        </p>
      )}

      <div className="mt-6 flex items-center justify-center gap-3 text-sm text-ink-faint">
        <span className="h-px w-10 bg-line-strong" />
        or
        <span className="h-px w-10 bg-line-strong" />
      </div>

      <button
        type="button"
        onClick={() => loadDoc(MOCK_DOC)}
        disabled={loading}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-calm px-6 py-3 text-sm font-semibold text-paper shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-calm-deep hover:shadow-lift disabled:opacity-50"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l1.6 4.8L18 9l-4.4 1.2L12 15l-1.6-4.8L6 9l4.4-1.2z" />
        </svg>
        Try a sample — an SBA 7(a) loan application
      </button>
    </div>
  );
}
