"use client";
// Spotlight — owned by Sawyer (transferred to Michael with the canvas job). Dims
// the page and cuts a hole over EACH active field box. Per-box, NOT one bounding
// box — a bounding box would also reveal the labels/titles printed between the
// boxes. No border here: the outline around each box is drawn by FieldOverlay, so
// the border sits on the text boxes, not around the lit region. pointer-events-none
// so the inputs under the holes stay clickable. Empty rects = dim everything (the
// active step lives off-page).
import type { Rect } from "@/lib/types";

export default function Spotlight({ rects }: { rects: Rect[] }) {
  const holes = rects.map((r) => ({ x: r.x * 100, y: r.y * 100, w: r.w * 100, h: r.h * 100 }));
  const pad = 0.4; // viewBox units, so the box edge shows through the dim

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="dt-spotlight">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {holes.map((h, i) => (
            <rect
              key={i}
              x={h.x - pad}
              y={h.y - pad}
              width={h.w + pad * 2}
              height={h.h + pad * 2}
              rx="0.6"
              fill="black"
            />
          ))}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="rgba(15,23,42,0.45)"
        mask="url(#dt-spotlight)"
        className="transition-all duration-300"
      />
    </svg>
  );
}
