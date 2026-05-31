"use client";
// DocCanvas — owned by Sawyer (transferred to Michael for the PDF-render job).
// Renders the active page and stacks the editable field overlays + spotlight on
// top. For the MOCK it draws page.image (an SVG data URL). For a real uploaded
// PDF it renders each page with pdfjs-dist to a canvas (worker served from
// /public) so the crisp real form shows and the NORMALIZED rects overlay it
// exactly. Pages render progressively — the first appears, the rest fill in. The
// render is keyed by the doc id, so a stale render is ignored once a new doc loads.
import { useEffect, useRef, useState } from "react";
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
  const { doc, active, lang } = useDoc();
  const [page, setPage] = useState(0);
  const [pdf, setPdf] = useState<PdfRender | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  // Jump to the page the active step lives on. Keyed on the page NUMBER, not the
  // whole `active` object: `active` is a fresh reference on every field edit, so
  // keying on it re-fired this on every keystroke and yanked the canvas back,
  // fighting manual Prev/Next paging. The page number only changes when the tour
  // moves to a step on a different page — exactly when we want to re-sync.
  const activePage = active?.spotlight?.page;
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync canvas to the active step's page
    if (activePage != null) setPage(activePage);
  }, [activePage]);

  // When a doc loads, render the uploaded PDF (if any) page-by-page via pdfjs.
  const docId = doc?.id ?? null;
  useEffect(() => {
    const up = getUploadedFile();
    // Don't paint the uploaded PDF onto the MOCK fallback (id "mock_sba_7a"): its
    // overlays are the mock's, not this doc's. If live extraction fails (e.g. API
    // quota), we show the coherent mock instead of the upload with wrong boxes.
    if (!docId || docId === "mock_sba_7a" || !up || up.mime !== "application/pdf") return;
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

  // The document runs on at full height; rather than zoom/crop, we scroll the
  // active step's box to the centre of the viewport so it's never cut off.
  const activeSpotY = active?.spotlight?.y ?? null;
  const activeSpotH = active?.spotlight?.h ?? 0;
  useEffect(() => {
    if (activeSpotY == null) return;
    const sc = scrollRef.current;
    const pg = pageRef.current;
    if (!sc || !pg) return;
    const id = requestAnimationFrame(() => {
      const center = (activeSpotY + activeSpotH / 2) * pg.offsetHeight;
      sc.scrollTo({ top: Math.max(0, center - sc.clientHeight / 2), behavior: "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [activeSpotY, activeSpotH, page, pdf]);

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
  // Per-box spotlight: cut a hole over each active field on this page (not the
  // group's bounding box, which would also light up the labels between boxes).
  const holes =
    active && active.spotlight && active.spotlight.page === idx
      ? active.fields.filter((f) => f.rect.page === idx).map((f) => f.rect)
      : [];

  const t = (en: string, es: string) => (lang === "es" ? es : en);

  return (
    <div className="relative flex h-full flex-col">
      {/* Pager pinned to the top-right corner of the document area. */}
      {pageCount > 1 && (
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-xl border border-line bg-card/90 px-1.5 py-1 text-xs font-medium text-ink-soft shadow-soft backdrop-blur">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={idx === 0}
            aria-label={t("Previous page", "Página anterior")}
            className="rounded-lg p-1 transition hover:bg-paper-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className="px-1 tabular-nums">
            {t("Page", "Página")} {idx + 1} {t("of", "de")} {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={idx >= pageCount - 1}
            aria-label={t("Next page", "Página siguiente")}
            className="rounded-lg p-1 transition hover:bg-paper-2 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
          </button>
        </div>
      )}

      {/* The document runs on at full WIDTH — the whole form is here, nothing
          cropped. It scrolls vertically; the active box is scrolled into view. */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto p-1">
        <div ref={pageRef} className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
          <div className="absolute inset-0 overflow-hidden rounded-xl border border-line-strong bg-card shadow-soft">
            {image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={image}
                alt={`Page ${idx + 1}`}
                draggable={false}
                className="absolute inset-0 h-full w-full select-none"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-paper-2 text-sm text-ink-faint">
                {t("Rendering your document…", "Procesando su documento…")}
              </div>
            )}
            {fields.map((f) => (
              <FieldOverlay key={f.id} field={f} />
            ))}
            <Spotlight rects={holes} />
          </div>
          {/* Guide card — sits above/below the focused box at its real position,
              never overlapping it. Keyed by step+language so it re-types each change. */}
          <GuideBox key={`${active?.id ?? "none"}-${lang}`} />
        </div>
      </div>
    </div>
  );
}
