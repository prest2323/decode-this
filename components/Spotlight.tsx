"use client";
// Spotlight — template owner Sawyer. Dims the whole page with a transparent
// cut-out over the active requirement's spotlight rect (normalized [0..1]).
// pointer-events-none so the fields under the hole stay clickable. A null rect
// means "dim everything" (the active step lives off-page). Sawyer animates it.
import type { Rect } from "@/lib/types";

export default function Spotlight({ rect }: { rect: Rect | null }) {
  const hole = rect
    ? { x: rect.x * 100, y: rect.y * 100, w: rect.w * 100, h: rect.h * 100 }
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
              className="transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]" 
            />
          )}
        </mask>
      </defs>
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="rgba(15,23,42,0.45)"
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
          stroke="#f59e0b"
          strokeWidth="0.5"
          className="transition-all duration-200 ease-[cubic-bezier(0.25,1,0.5,1)]"
        />
      )}
    </svg>
  );
}
