"use client";
// Spotlight — template owner Sawyer. Dims the whole page with a transparent
// cut-out over the active requirement's spotlight rect (normalized [0..1]).
// pointer-events-none so the fields under the hole stay clickable. A null rect
// means "dim everything" (the active step lives off-page). Sawyer animates it.
import type { Rect } from "@/lib/types";

export default function Spotlight({ rect }: { rect: Rect | null }) {
  // 10% breathing room around the highlighted region so the cut-out never
  // clips the labels/text that hug the fields. Clamped to the page.
  const PAD = 0.1;
  const hole = rect
    ? (() => {
        const x = Math.max(0, rect.x - rect.w * PAD);
        const y = Math.max(0, rect.y - rect.h * PAD);
        const w = Math.min(1 - x, rect.w * (1 + 2 * PAD));
        const h = Math.min(1 - y, rect.h * (1 + 2 * PAD));
        return { x: x * 100, y: y * 100, w: w * 100, h: h * 100 };
      })()
    : null;
  return (
    <svg
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
              className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
            />
          )}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="rgba(28,42,39,0.42)"
        mask="url(#dt-spotlight)"
      />
      {hole && (
        <rect
          x={hole.x}
          y={hole.y}
          width={hole.w}
          height={hole.h}
          rx="0.8"
          fill="none"
          stroke="#d75a32"
          strokeWidth="0.5"
          className="transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
        />
      )}
    </svg>
  );
}
