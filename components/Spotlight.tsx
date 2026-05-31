"use client";
// Spotlight — dims the page and cuts a hole over EACH active field box (per-box,
// NOT one bounding box — a bounding box would also reveal the labels printed
// between the boxes). A small pad gives each box breathing room; the holes + dim
// glide together with smooth easing. No border here (FieldOverlay draws the box
// outline). Empty rects = dim everything (the active step lives off-page).
import type { Rect } from "@/lib/types";

export default function Spotlight({ rects }: { rects: Rect[] }) {
  const pad = 1.0; // viewBox units of breathing room around each box
  const grow = 0.1; // +10% per box, so the spotlight clears the label/title text
  const holes = rects.map((r) => {
    const w = r.w * 100;
    const h = r.h * 100;
    const gx = (w * grow) / 2;
    const gy = (h * grow) / 2;
    return {
      x: Math.max(0, r.x * 100 - pad - gx),
      y: Math.max(0, r.y * 100 - pad - gy),
      w: w + pad * 2 + gx * 2,
      h: h + pad * 2 + gy * 2,
    };
  });
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
              x={h.x}
              y={h.y}
              width={h.w}
              height={h.h}
              rx="0.7"
              fill="black"
              className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
          ))}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="rgba(28,42,39,0.42)"
        mask="url(#dt-spotlight)"
        className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
    </svg>
  );
}
