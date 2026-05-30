"use client";
// FieldOverlay — owned by Sawyer (transferred to Michael with the canvas job).
// One editable input positioned on the page by its NORMALIZED rect (% of the page
// box, so it lines up at any zoom). The active requirement's fields glow amber.
// The text is sized to the box: it starts from the box height, then shrinks to fit
// the width as you type, so the value always stays inside the box.
import { useCallback, useEffect, useRef, type CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import type { Field } from "@/lib/types";

export default function FieldOverlay({ field }: { field: Field }) {
  const { setFieldValue, active } = useDoc();
  const isActive = !!active?.fields.some((f) => f.id === field.id);
  const ref = useRef<HTMLInputElement>(null);

  const text =
    typeof field.value === "string" ? field.value : field.value == null ? "" : String(field.value);

  // Fit the font to the box: scale from box height, then shrink until the text
  // fits the box width. Recomputed when the value changes or the box resizes/zooms.
  const fit = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    let size = Math.max(6, Math.min(el.clientHeight * 0.6, 22));
    el.style.fontSize = `${size}px`;
    let guard = 0;
    while (el.scrollWidth > el.clientWidth + 1 && size > 6 && guard < 60) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
      guard++;
    }
  }, []);

  useEffect(() => {
    fit();
  }, [text, fit]);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => fit());
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit]);

  const style: CSSProperties = {
    left: `${field.rect.x * 100}%`,
    top: `${field.rect.y * 100}%`,
    width: `${field.rect.w * 100}%`,
    height: `${field.rect.h * 100}%`,
  };

  const ring = isActive
    ? "ring-2 ring-amber-400 z-40 bg-amber-50/90"
    : "ring-1 ring-slate-300 z-10 bg-white/85";

  if (field.kind === "checkbox") {
    return (
      <input
        type="checkbox"
        aria-label={field.label.en}
        checked={field.value === true}
        onChange={(e) => setFieldValue(field.id, e.target.checked)}
        style={style}
        className={`absolute cursor-pointer accent-amber-500 ${ring}`}
      />
    );
  }

  return (
    <input
      ref={ref}
      aria-label={field.label.en}
      value={text}
      placeholder={field.placeholder}
      onChange={(e) => setFieldValue(field.id, e.target.value)}
      style={style}
      className={`absolute rounded-sm px-1 leading-none text-slate-900 outline-none placeholder:text-slate-400 ${ring}`}
    />
  );
}
