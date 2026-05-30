"use client";
// DocCanvas — template owner Sawyer. Renders the active page and stacks the
// editable field overlays + the spotlight on top. The template draws the page
// from page.image (an SVG data URL in the mock); in Phase 1 Sawyer swaps in real
// pdfjs-dist rendering (page -> canvas + viewport size) — the overlay math stays
// the same because rects are NORMALIZED. Follows the active step's page.
import { useEffect, useState } from "react";
import { useDoc } from "@/lib/store";
import FieldOverlay from "@/components/FieldOverlay";
import Spotlight from "@/components/Spotlight";
import GuideBox from "@/components/GuideBox";

export default function DocCanvas() {
  const { doc, active } = useDoc();
  const [page, setPage] = useState(0);

  // jump to the page the active step lives on
  useEffect(() => {
    if (active?.spotlight) setPage(active.spotlight.page);
  }, [active]);

  if (!doc) return null;
  const pg = doc.pages[page] ?? doc.pages[0];
  const fields = doc.requirements
    .flatMap((r) => r.fields)
    .filter((f) => f.rect.page === pg.index);
  const spot =
    active?.spotlight && active.spotlight.page === pg.index ? active.spotlight : null;

  return (
    <div className="flex h-full flex-col">
      {doc.pages.length > 1 && (
        <div className="mb-2 flex items-center justify-center gap-3 text-sm text-slate-600">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-md border border-slate-300 px-2 py-0.5 disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span>
            Page {pg.index + 1} of {doc.pages.length}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(doc.pages.length - 1, p + 1))}
            disabled={page >= doc.pages.length - 1}
            className="rounded-md border border-slate-300 px-2 py-0.5 disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}

      <div className="flex flex-1 items-start justify-center overflow-auto">
        <div
          className="relative w-full max-w-[640px] rounded-lg border border-slate-300 shadow-sm"
          style={{ aspectRatio: `${pg.width} / ${pg.height}` }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={pg.image}
            alt={`Page ${pg.index + 1}`}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none rounded-lg"
          />
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
