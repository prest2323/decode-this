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
    <div className="mx-auto w-full max-w-xl text-center px-4 animate-fadeIn">
      {/* Flat, Sharp Drag & Drop Box (Linear/Vercel styling) */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-slate-900 bg-slate-50 scale-[1.005]"
            : "border-slate-350 bg-white hover:border-slate-900 hover:bg-slate-50/50"
        } ${loading ? "pointer-events-none opacity-80" : ""}`}
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
          // Crisp, minimal loading block
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
            <div>
              <p className="text-sm font-bold text-slate-900">
                Analyzing document with AI…
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-[260px] mx-auto leading-relaxed">
                Extracting legal clauses, mapping form fields, and preparing active overlays.
              </p>
            </div>
          </div>
        ) : (
          // Sharp, minimal idle upload state
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl select-none grayscale group-hover:grayscale-0 transition-all duration-300">
              📄
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Upload your document to begin
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto leading-relaxed">
                Drag and drop your PDF or image here, or browse.
              </p>
            </div>

            {/* Flat format chips */}
            <div className="flex gap-1.5 mt-1">
              {["PDF", "PNG", "JPG"].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 text-[10px] font-bold tracking-tight text-slate-500 bg-slate-100 rounded border border-slate-200/50 select-none"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redesigned minimal error block */}
      {error && (
        <div className="mt-4 rounded-md bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 flex items-start gap-2.5 text-left animate-fadeIn shadow-sm">
          <span className="text-sm select-none">⚠️</span>
          <div className="space-y-0.5">
            <p className="font-bold">Analysis Failed</p>
            <p className="text-rose-600 font-medium leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Sleek, sharp Vercel-style sample launcher button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            (window as any).__pdfData = null; // Clear manual PDF data to trigger mock raster
          }
          loadDoc(MOCK_DOC);
        }}
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-slate-900 text-white font-bold px-6 py-2.5 text-xs shadow-sm hover:bg-slate-800 active:scale-98 transition-all disabled:opacity-50 border border-slate-950"
      >
        <span>✨</span>
        <span>Open SBA 7(a) Loan Sample</span>
      </button>
    </div>
  );
}
