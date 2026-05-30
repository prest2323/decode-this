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
      {/* Dashed Drag & Drop Box with iOS 26 Glassmorphic styling */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center gap-6 rounded-[2.2rem] p-12 text-center cursor-pointer transition-all duration-500 overflow-hidden ios-glass ios-glass-hover ${
          dragActive
            ? "border-brand bg-gradient-to-b from-brand-soft/75 to-brand-soft/30 scale-[1.02] shadow-2xl ring-4 ring-brand/15"
            : ""
        } ${loading ? "pointer-events-none opacity-85" : ""}`}
      >
        {/* Soft background light projection */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand/5 via-transparent to-brand/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

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
          // Premium Glass-Spinner loading block
          <div className="flex flex-col items-center gap-5 py-4 z-10">
            <div className="relative flex items-center justify-center">
              {/* Outer soft glowing halo */}
              <div className="absolute h-16 w-16 rounded-full border-4 border-brand/10 animate-ping" />
              {/* Inner loading ring */}
              <div className="h-12 w-12 animate-spin rounded-full border-[3px] border-brand border-t-transparent shadow-inner" />
            </div>
            <div>
              <p className="text-lg font-black text-slate-800 animate-pulse tracking-tight">
                AI Analizador activado…
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                Mapping requirements, indexing fields, and projecting spatial coordinate overlays.
              </p>
            </div>
          </div>
        ) : (
          // Glass Idle upload state
          <div className="flex flex-col items-center gap-4 z-10">
            {/* Glowing Icon Wrapper */}
            <div className="relative w-20 h-20 rounded-[1.3rem] bg-gradient-to-br from-white/90 to-white/30 flex items-center justify-center text-4xl shadow-md border border-white/60 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-lg transition-all duration-500">
              <span className="group-hover:animate-bounce select-none">📸</span>
              {/* Ambient ground shadow below the icon */}
              <div className="absolute -bottom-1 w-12 h-1.5 bg-slate-400/20 rounded-full blur-[2px]" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-855 tracking-tight leading-none">
                Scan or drop your document
              </h3>
              <p className="text-sm font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                Supports PDF or photo formats. Real-time extraction converts scanned images instantly.
              </p>
            </div>

            {/* Glass format chips */}
            <div className="flex gap-2 mt-2">
              {["PDF", "PNG", "JPEG"].map((ext) => (
                <span
                  key={ext}
                  className="px-3 py-1 text-[9px] font-black tracking-wider text-slate-500 bg-white/50 backdrop-blur-sm rounded-full border border-white/60 shadow-sm"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redesigned glassy error block */}
      {error && (
        <div className="mt-5 rounded-[1.5rem] bg-red-50/50 backdrop-blur-md border border-red-100 p-4 text-sm text-red-600 flex items-start gap-3 text-left animate-fadeIn shadow-lg">
          <span className="text-lg select-none">🚨</span>
          <div className="space-y-0.5">
            <p className="font-bold text-red-700">Service Alert</p>
            <p className="text-red-650 leading-relaxed font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Deep iOS-style slate sample launcher button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            (window as any).__pdfData = null; // Clear manual PDF data to trigger mock raster
          }
          loadDoc(MOCK_DOC);
        }}
        disabled={loading}
        className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-slate-900 text-white font-extrabold px-8 py-4 text-sm shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-300 disabled:opacity-50 border border-white/10"
      >
        <span>✨</span>
        <span>Launch SBA 7(a) Loan Sample</span>
      </button>
    </div>
  );
}
