"use client";
// Spotlight — owner Sawyer. Dims the whole page with a transparent cut-out over
// the active requirement's spotlight rect (normalized [0..1]). pointer-events-none
// so the fields under the hole stay clickable. A null rect means "dim everything"
// (the active step lives off-page). The hole + ring glide between steps (350ms).
import type { Rect } from "@/lib/types";

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function Spotlight({ rect }: { rect: Rect | null }) {
  // Defensive clamp: an off-spec model rect must never paint outside the page.
  let hole: { x: number; y: number; w: number; h: number } | null = null;
  if (rect) {
    const x = clamp01(rect.x);
    const y = clamp01(rect.y);
    hole = {
      x: x * 100,
      y: y * 100,
      w: clamp01(Math.min(rect.w, 1 - x)) * 100,
      h: clamp01(Math.min(rect.h, 1 - y)) * 100,
    };
  }

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <mask id="dt-spotlight">
          <rect x="0" y="0" width="100" height="100" fill="white" />
          {hole && (
            <rect
              x={hole.x}
              y={hole.y}
              width={hole.w}
              height={hole.h}
              rx="0.8"
              fill="black"
              className="transition-all duration-300 ease-out"
            />
          )}
        </mask>
      </defs>
      {/* the dim everywhere the mask is white (i.e. everywhere but the hole) */}
      <rect x="0" y="0" width="100" height="100" fill="rgba(15,23,42,0.5)" mask="url(#dt-spotlight)" />
      {/* a crisp sky ring around the lit window, glides with the hole */}
      {hole && (
        <rect
          x={hole.x}
          y={hole.y}
          width={hole.w}
          height={hole.h}
          rx="0.8"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="0.5"
          className="transition-all duration-300 ease-out"
        />
      )}
    </svg>
  );
}
