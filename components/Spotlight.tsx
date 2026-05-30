"use client";
// Spotlight — template owner Sawyer. Dims the whole page with a transparent
// cut-out over the active requirement's spotlight rect (normalized [0..1]).
// pointer-events-none so the fields under the hole stay clickable. A null rect
// means "dim everything" (the active step lives off-page). Sawyer animates it.
import type { Rect } from "@/lib/types";

export default function Spotlight({ rect }: { rect: Rect | null }) {
  if (!rect) return null;

  // Defensive clamping to ensure that the spotlight cutout is always within the page bounds.
  const cx = Math.max(0, Math.min(1, rect.x));
  const cy = Math.max(0, Math.min(1, rect.y));
  const cw = Math.max(0, Math.min(1 - cx, rect.w));
  const ch = Math.max(0, Math.min(1 - cy, rect.h));

  // Convert to 0..100 percentages for viewBox coordinates
  const hole = {
    x: cx * 100,
    y: cy * 100,
    w: cw * 100,
    h: ch * 100,
  };

  const maskId = `dt-spotlight-${rect.page}`;

  return (
    <svg
      className="pointer-events-none absolute inset-0 z-30 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <defs>
        <mask id={maskId}>
          {/* White paints everywhere to dim, Black cuts a hole in the dim */}
          <rect x="0" y="0" width="100" height="100" fill="white" />
          <rect
            x={hole.x}
            y={hole.y}
            width={hole.w}
            height={hole.h}
            rx="1.2"
            fill="black"
            style={{ transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </mask>
      </defs>
      
      {/* The dimming mask layer */}
      <rect
        x="0"
        y="0"
        width="100"
        height="100"
        fill="rgba(15,23,42,0.55)"
        mask={`url(#${maskId})`}
      />

      {/* The glowing active border drawn on top of the dim */}
      <rect
        x={hole.x}
        y={hole.y}
        width={hole.w}
        height={hole.h}
        rx="1.2"
        fill="none"
        stroke="#38bdf8"
        strokeWidth="0.4"
        style={{ transition: "all 350ms cubic-bezier(0.4, 0, 0.2, 1)" }}
      />
    </svg>
  );
}
