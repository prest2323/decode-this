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
      {/* Flat, Sharp VS Code style Drag & Drop Box */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !loading && inputRef.current?.click()}
        className={`group relative flex flex-col items-center justify-center gap-6 rounded-none border border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
          dragActive
            ? "border-[#007acc] bg-[#2d2d2d] scale-[1.002] shadow-md shadow-[#007acc]/5"
            : "border-[#3c3c3c] bg-[#252526] hover:border-[#555555] hover:bg-[#2d2d2d]/80"
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
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#007acc] border-t-transparent" />
            <div>
              <p className="text-sm font-bold text-white">
                Analyzing document with AI…
              </p>
              <p className="mt-1 text-xs text-[#858585] max-w-[260px] mx-auto leading-relaxed font-medium">
                Extracting legal clauses, mapping form fields, and preparing active overlays.
              </p>
            </div>
          </div>
        ) : (
          // Sharp, minimal idle upload state
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl select-none group-hover:scale-105 transition-all duration-300">
              📄
            </div>
            
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Upload your document to begin
              </h3>
              <p className="text-xs font-medium text-[#858585] max-w-xs mx-auto leading-relaxed">
                Drag and drop your PDF or image here, or browse.
              </p>
            </div>

            {/* Flat format chips */}
            <div className="flex gap-1.5 mt-1">
              {["PDF", "PNG", "JPG"].map((ext) => (
                <span
                  key={ext}
                  className="px-2 py-0.5 text-[9px] font-bold tracking-tight text-[#cccccc] bg-[#2d2d2d] rounded-none border border-[#3c3c3c] select-none"
                >
                  {ext}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Redesigned minimal warning/error block */}
      {error && (
        <div className="mt-4 rounded-none bg-[#2d2d2d] border border-[#3c3c3c] p-3 text-xs text-[#f48771] flex items-start gap-2.5 text-left animate-fadeIn shadow-sm">
          <span className="text-sm select-none">⚠️</span>
          <div className="space-y-0.5">
            <p className="font-bold">Service Interrupted</p>
            <p className="font-medium leading-relaxed opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* Sleek, sharp VS Code blue style sample launcher button */}
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") {
            (window as any).__pdfData = null; // Clear manual PDF data to trigger mock raster
          }
          loadDoc(MOCK_DOC);
        }}
        disabled={loading}
        className="mt-6 inline-flex items-center gap-2 rounded-sm bg-[#007acc] hover:bg-[#1a8ad4] text-white font-bold px-6 py-2.5 text-xs shadow-md border border-[#007acc]/95 active:scale-98 transition-all disabled:opacity-50 select-none cursor-pointer"
      >
        <span>✨</span>
        <span>Launch SBA 7(a) Loan Sample</span>
      </button>
    </div>
  );
}
