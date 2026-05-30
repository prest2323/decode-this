"use client";
// DocCanvas — template owner Sawyer. Renders the active page and stacks the
// editable field overlays + the spotlight on top. Swaps in real
// pdfjs-dist rendering (page -> canvas + viewport size) — the overlay math stays
// the same because rects are NORMALIZED. Follows the active step's page.
import { useEffect, useState, useRef } from "react";
import { useDoc } from "@/lib/store";
import FieldOverlay from "@/components/FieldOverlay";
import Spotlight from "@/components/Spotlight";
import GuideBox from "@/components/GuideBox";
import type { DocPage } from "@/lib/types";

export default function DocCanvas() {
  const { doc, active } = useDoc();
  const [scale, setScale] = useState(1.0);
  const [pdfjs, setPdfjs] = useState<any>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);

  // 1. Dynamic import pdfjs-dist on the client side to avoid SSR "DOMMatrix is not defined" error
  useEffect(() => {
    let isMounted = true;
    import("pdfjs-dist").then((mod) => {
      if (isMounted) {
        mod.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        setPdfjs(mod);
      }
    }).catch((err) => {
      console.error("Failed to load pdfjs-dist dynamically:", err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load the PDF document client-side if a raw PDF URL/base64 exists in global cache
  useEffect(() => {
    if (!pdfjs) return;

    const pdfData = typeof window !== "undefined" ? (window as any).__pdfData : null;
    if (!pdfData) {
      setPdfDoc(null);
      return;
    }

    let isMounted = true;
    const loadPdf = async () => {
      try {
        const loadingTask = pdfjs.getDocument({ url: pdfData });
        const pdf = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(pdf);
        }
      } catch (err) {
        console.error("Error loading PDF via PDF.js:", err);
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [doc, pdfjs]);

  // 3. Auto-scroll to the active requirement's spotlight
  useEffect(() => {
    if (!active?.spotlight) return;
    const pageIndex = active.spotlight.page;
    const element = document.getElementById(`page-box-${pageIndex}`);
    if (element) {
      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      element.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "center",
      });
    }
  }, [active?.id]);

  // 4. Calm empty state
  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-2xl m-4">
        <div className="w-16 h-16 mb-4 flex items-center justify-center rounded-full bg-sky-100 text-sky-600 text-2xl animate-pulse">
          📄
        </div>
        <h3 className="text-lg font-bold text-slate-800">Drop a document to begin</h3>
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm leading-relaxed">
          Once you upload your document, we will build a visual roadmap and walk you through every required field step-by-step.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* 5. Canvas Zoom/Fit Toolbar */}
      <div className="mb-4 flex items-center justify-center gap-3 border-b border-slate-100 pb-3">
        <button
          type="button"
          onClick={() => setScale((s) => Math.max(0.6, s - 0.1))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm transition"
        >
          Zoom −
        </button>
        <span className="text-xs font-semibold text-slate-500 min-w-[50px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setScale((s) => Math.min(1.8, s + 0.1))}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm transition"
        >
          Zoom +
        </button>
        <button
          type="button"
          onClick={() => setScale(1.0)}
          className="rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 shadow-sm transition"
        >
          Fit
        </button>
      </div>

      {/* 6. Document Scroll & Render View */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="relative mx-auto w-full flex flex-col items-center">
          {doc.pages.map((p) => {
            const fields = doc.requirements
              .flatMap((r) => r.fields)
              .filter((f) => f.rect.page === p.index);

            return (
              // PAGE BOX — positioning context with responsive aspect ratio
              <div
                id={`page-box-${p.index}`}
                key={p.index}
                className="relative mb-8 w-full overflow-hidden rounded-xl border border-slate-200 shadow-md bg-white transition-all duration-300"
                style={{
                  maxWidth: `${768 * scale}px`,
                  aspectRatio: `${p.width} / ${p.height}`,
                }}
              >
                {/* Real-time PDF rendering or raster mock image */}
                <PageRenderer p={p} pdfDoc={pdfDoc} />

                {/* OVERLAY LAYER — fits exactly over page; children positioned in % */}
                <div className="pointer-events-none absolute inset-0">
                  {/* Spotlight dims the background */}
                  {active?.spotlight && active.spotlight.page === p.index && (
                    <Spotlight rect={active.spotlight} />
                  )}

                  {/* Fields positioned absolutely by normalized coordinates */}
                  {fields.map((f) => (
                    <FieldOverlay key={f.id} field={f} />
                  ))}

                  {/* floating GuideBox for active step on the current page box */}
                  {((active?.spotlight && active.spotlight.page === p.index) ||
                    (!active?.spotlight && p.index === 0)) && (
                    <GuideBox />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * PageRenderer handles high fidelity canvas rendering from a PDF document,
 * or defaults to displaying the fallback mock raster image.
 */
function PageRenderer({ p, pdfDoc }: { p: DocPage; pdfDoc: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [renderError, setRenderError] = useState(false);
  const [rendering, setRendering] = useState(false);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;
    
    let isCurrent = true;
    let renderTask: any = null;

    const render = async () => {
      setRendering(true);
      try {
        const page = await pdfDoc.getPage(p.index + 1);
        const scale = 2; // Crisp on Retina/HiDPI screens
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        
        if (!canvas || !isCurrent) return;

        const context = canvas.getContext("2d");
        if (!context) return;

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);

        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== "RenderingCancelledException") {
          console.error("PDF render failed for page index:", p.index, err);
          if (isCurrent) setRenderError(true);
        }
      } finally {
        if (isCurrent) setRendering(false);
      }
    };

    render();

    return () => {
      isCurrent = false;
      if (renderTask) {
        renderTask.cancel();
      }
    };
  }, [pdfDoc, p.index]);

  // Fallback to raster mock image if PDF document is not available, or image is explicitly a data URL
  if (!pdfDoc || (p.image && p.image.startsWith("data:image/"))) {
    return (
      <img
        src={p.image}
        alt={`Page ${p.index + 1}`}
        className="block h-full w-full select-none"
        draggable={false}
      />
    );
  }

  if (renderError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-500 text-sm">
        Failed to render PDF page.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {rendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="block h-full w-full select-none"
      />
    </div>
  );
}
