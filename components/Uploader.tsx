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
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const analyze = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result as string);
          r.onerror = () => reject(new Error("File reading failed"));
          r.readAsDataURL(file);
        });

        // Store the original base64 file in the client-side global variable so DocCanvas can render it crisp via PDF.js
        if (typeof window !== "undefined") {
          (window as any).__pdfData = dataUrl;
        }

        const resp = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, file: dataUrl, mime: file.type }),
        });

        const json = (await resp.json()) as ApiResponse<DocumentModel>;
        if (json.ok) {
          loadDoc(json.result);
        } else {
          setError(json.error || "The AI analyzer encountered an error. Try again or run the demo sample.");
        }
      } catch (err: any) {
        setError("Unable to read this file. Please make sure it is a valid PDF or Image, or try the mock sample.");
      } finally {
        setLoading(false);
      }
    },
    [loadDoc],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        analyze(e.dataTransfer.files[0]);
      }
    },
    [analyze],
  );

  return (
    <div className="mx-auto w-full max-w-xl text-center px-4">
      {/* Dashed Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-brand bg-brand-soft/50 scale-[1.01] shadow-md"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50/50"
        } ${loading ? "pointer-events-none opacity-60" : ""}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              analyze(e.target.files[0]);
            }
          }}
        />

        {loading ? (
          // Spinner Loading State
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
            <p className="text-base font-bold text-slate-800 animate-pulse">
              AI Analyzing your document…
            </p>
            <p className="text-xs text-slate-500">
              Breaking down complex clauses & requirements
            </p>
          </div>
        ) : (
          // Idle Upload State
          <>
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
              📂
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">
                📷 Take a photo / Upload your document
              </p>
              <p className="mt-1 text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
                Drop your PDF or image here, or tap to browse. Works with mobile cameras.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 flex items-center gap-2 text-left animate-fadeIn">
          <span className="text-base">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Mock Document Fallback */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            (window as any).__pdfData = null; // Clear manual PDF data to trigger mock raster
          }
          loadDoc(MOCK_DOC);
        }}
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-slate-800 hover:shadow-lg active:scale-95 transition-all disabled:opacity-50"
      >
        ✨ Try the SBA 7(a) loan application sample
      </button>
    </div>
  );
}
