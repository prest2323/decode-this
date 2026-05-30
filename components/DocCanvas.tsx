"use client";
// DocCanvas — owned by Sawyer (transferred to Michael for the PDF-render job).
// Renders the active page and stacks the editable field overlays + spotlight on
// top. For the MOCK it draws page.image (an SVG data URL). For a real uploaded
// PDF it renders each page with pdfjs-dist to a canvas (worker served from
// /public) so the crisp real form shows and the NORMALIZED rects overlay it
// exactly. Pages render progressively — the first appears, the rest fill in. The
// render is keyed by the doc id, so a stale render is ignored once a new doc loads.
import { useEffect, useState } from "react";
import { useDoc } from "@/lib/store";
import FieldOverlay from "@/components/FieldOverlay";
import Spotlight from "@/components/Spotlight";
import GuideBox from "@/components/GuideBox";
import { getUploadedFile } from "@/components/uploadedDoc";

interface RenderedPage {
  image: string;
  width: number;
  height: number;
}
interface PdfRender {
  id: string;
  count: number;
  pages: Record<number, RenderedPage>;
}

// pdfjs-dist v6 calls Map.prototype.getOrInsertComputed / getOrInsert (the TC39
// "upsert" proposal) during render — methods browsers don't ship yet, so render
// throws on PDFs with optional content. Polyfill them (idempotent, non-enumerable
// like the native methods) before we touch pdfjs.
function installPdfPolyfills(): void {
  const proto = Map.prototype as unknown as {
    getOrInsertComputed?: unknown;
    getOrInsert?: unknown;
  };
  if (typeof proto.getOrInsertComputed !== "function") {
    Object.defineProperty(Map.prototype, "getOrInsertComputed", {
      value: function <K, V>(this: Map<K, V>, key: K, compute: (k: K) => V): V {
        if (this.has(key)) return this.get(key) as V;
        const v = compute(key);
        this.set(key, v);
        return v;
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
  if (typeof proto.getOrInsert !== "function") {
    Object.defineProperty(Map.prototype, "getOrInsert", {
      value: function <K, V>(this: Map<K, V>, key: K, value: V): V {
        if (this.has(key)) return this.get(key) as V;
        this.set(key, value);
        return value;
      },
      writable: true,
      configurable: true,
      enumerable: false,
    });
  }
}

export default function DocCanvas() {
  const { doc, active } = useDoc();
  const [page, setPage] = useState(0);
  const [pdf, setPdf] = useState<PdfRender | null>(null);

  // jump to the page the active step lives on
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync canvas to the active step's page
    if (active?.spotlight) setPage(active.spotlight.page);
  }, [active]);

  // When a doc loads, render the uploaded PDF (if any) page-by-page via pdfjs.
  const docId = doc?.id ?? null;
  useEffect(() => {
    const up = getUploadedFile();
    if (!docId || !up || up.mime !== "application/pdf") return;
    let cancelled = false;
    (async () => {
      try {
        installPdfPolyfills();
        const pdfjs = await import("pdfjs-dist");
        if (cancelled) return;
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
        const b64 = up.dataUrl.replace(/^data:.*?;base64,/, "");
        const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const pdfDoc = await pdfjs.getDocument({ data: bytes }).promise;
        if (cancelled) return;
        setPdf({ id: docId, count: pdfDoc.numPages, pages: {} });
        for (let i = 1; i <= pdfDoc.numPages; i++) {
          const pageObj = await pdfDoc.getPage(i);
          const viewport = pageObj.getViewport({ scale: 2 }); // 2x for crispness
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await pageObj.render({ canvas, canvasContext: ctx, viewport }).promise;
          if (cancelled) return;
          const rendered: RenderedPage = {
            image: canvas.toDataURL("image/png"),
            width: viewport.width,
            height: viewport.height,
          };
          setPdf((prev) =>
            prev && prev.id === docId ? { ...prev, pages: { ...prev.pages, [i - 1]: rendered } } : prev,
          );
        }
      } catch (e) {
        console.error("pdf render failed:", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [docId]);

  if (!doc) return null;

  // Use the live PDF render only if it's for THIS doc (else a stale one lingers).
  const usingPdf = pdf !== null && pdf.id === docId && pdf.count > 0;
  const pageCount = usingPdf ? pdf.count : doc.pages.length;
  const idx = Math.max(0, Math.min(page, pageCount - 1));
  const fallbackPg = doc.pages[idx] ?? doc.pages[0] ?? null;
  const rp = usingPdf ? pdf.pages[idx] : null;
  const image = usingPdf ? rp?.image ?? "" : fallbackPg?.image ?? "";
  const width = usingPdf ? rp?.width ?? 850 : fallbackPg?.width ?? 850;
  const height = usingPdf ? rp?.height ?? 1100 : fallbackPg?.height ?? 1100;

  const fields = doc.requirements.flatMap((r) => r.fields).filter((f) => f.rect.page === idx);
  const spot = active?.spotlight && active.spotlight.page === idx ? active.spotlight : null;

  return (
    <div className="flex h-full flex-col">
      {pageCount > 1 && (
        <div className="mb-2 flex items-center justify-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={idx === 0}
            className="rounded-md border border-slate-300 px-2 py-0.5 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span>
            Page {idx + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={idx >= pageCount - 1}
            className="rounded-md border border-slate-300 px-2 py-0.5 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}

      <div className="flex flex-1 items-start justify-center overflow-auto">
        <div
          className="relative w-full max-w-[640px] rounded-lg border border-slate-300 shadow-sm"
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={image}
              alt={`Page ${idx + 1}`}
              draggable={false}
              className="absolute inset-0 h-full w-full select-none rounded-lg"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-slate-50 text-sm text-slate-400">
              Rendering your document…
            </div>
          )}
          {fields.map((f) => (
            <FieldOverlay key={f.id} field={f} />
          ))}
          <Spotlight rect={spot} />
          {/* The guide-text card (Aiden's) lives in this same page box so its
              placement aligns with the spotlight and never covers the field. */}
          <GuideBox />
        </div>
      </div>
    </div>
  );
}
