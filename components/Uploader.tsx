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
      {/* Dashed Drag & Drop Box with Ambient Glow */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center gap-6 rounded-3xl border-2 p-12 text-center cursor-pointer transition-all duration-500 overflow-hidden ${
          dragActive
            ? "border-brand bg-gradient-to-b from-brand-soft/70 to-brand-soft/30 scale-[1.02] shadow-2xl ring-4 ring-brand/10"
            : "border-slate-200 bg-white/70 backdrop-blur-md shadow-lg hover:border-brand/40 hover:bg-slate-50/50 hover:shadow-xl"
        } ${loading ? "pointer-events-none opacity-85" : ""}`}
      >
        {/* Decorative ambient background gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-soft/10 via-transparent to-brand-soft/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

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
          // Premium Spinner Loading State
          <div className="flex flex-col items-center gap-4 py-4 z-10">
            <div className="relative flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div className="absolute h-14 w-14 rounded-full border-4 border-brand/20 animate-ping" />
              {/* Inner crisp spinner */}
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent shadow-md" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 animate-pulse tracking-tight">
                Analyzing document with AI…
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                Mapping fields, extracting compliance targets, and building your step-by-step roadmap.
              </p>
            </div>
          </div>
        ) : (
          // Premium Idle Upload State
          <div className="flex flex-col items-center gap-4 z-10">
            {/* Glowing Icon Folder Wrapper */}
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md transition-all duration-500 border border-slate-200/50">
              <span className="group-hover:animate-bounce select-none">📂</span>
              {/* Soft decorative shadow below folder */}
              <div className="absolute -bottom-1 w-10 h-1 bg-slate-300/40 rounded-full blur-sm" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight leading-none">
                📷 Take a photo / Upload a document
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                Drag & drop your PDF or image here, or tap to browse. Fits rear mobile cameras perfectly.
              </p>
            </div>
            {/* Tiny file type visual chips */}
            <div className="flex gap-2 mt-1">
              {["PDF", "PNG", "JPEG"].map((ext) => (
                <span
                  key={ext}
                  className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-400 bg-slate-100 rounded-md border border-slate-200/30"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modern Redesigned Error Message */}
      {error && (
        <div className="mt-5 rounded-2xl bg-red-50/70 backdrop-blur-sm border border-red-100 p-4 text-sm text-red-600 flex items-start gap-3 text-left animate-fadeIn shadow-sm">
          <span className="text-lg select-none">🚩</span>
          <div className="space-y-0.5">
            <p className="font-bold text-red-700">Analysis stopped</p>
            <p className="text-red-600/90 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Hero Mock Document Sample Button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            (window as any).__pdfData = null; // Clear manual PDF data to trigger mock raster
          }
          loadDoc(MOCK_DOC);
        }}
        disabled={loading}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 px-7 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:from-slate-850 hover:to-slate-750 active:scale-95 transition-all duration-300 disabled:opacity-50 border border-white/5"
      >
        <span>✨</span>
        <span>Try the SBA 7(a) loan application sample</span>
      </button>
    </div>
  );
}
