"use client";
// Uploader — owned by Sawyer (transferred to Michael for the PDF-render job).
// PDF-only: pick/drop a PDF -> stash its bytes for the canvas (pdfjs renders the
// real page) -> POST /api/analyze -> loadDoc(result). Also a one-click "Try the
// SBA sample" that loads the mock instantly (network-proof hero on stage).
import { useCallback, useRef, useState } from "react";
import { useDoc } from "@/lib/store";
import { MOCK_DOC } from "@/lib/mock";
import { setUploadedFile, clearUploadedFile } from "@/components/uploadedDoc";
import type { ApiResponse, DocumentModel } from "@/lib/types";

const isPdf = (f: File): boolean =>
  f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");

export default function Uploader() {
  const { loadDoc } = useDoc();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyze = useCallback(
    async (file: File) => {
      if (!isPdf(file)) {
        setError("Please upload a PDF — that's the format we can read and walk you through. (Or try the sample below.)");
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(new Error("read failed"));
          r.readAsDataURL(file);
        });
        // Keep the bytes so the canvas can render the REAL PDF page (pdfjs).
        setUploadedFile(dataUrl, "application/pdf");
        const resp = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, file: dataUrl, mime: "application/pdf" }),
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
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 transition ${
          drag ? "border-amber-400 bg-amber-50" : "border-slate-300 bg-white hover:border-slate-400"
        }`}
      >
        <div className="text-4xl">📄</div>
        <p className="mt-3 text-lg font-semibold text-slate-800">
          {loading ? "Reading your document…" : "Drop a PDF here"}
        </p>
        <p className="mt-1 text-sm text-slate-500">
          We&apos;ll read the real form, break it down, and walk you through every step.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analyze(f);
          }}
        />
      </div>

      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={() => {
          clearUploadedFile();
          loadDoc(MOCK_DOC);
        }}
        disabled={loading}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        ✨ Try the sample — an SBA 7(a) loan application
      </button>
    </div>
  );
}
