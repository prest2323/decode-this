"use client";
// FieldOverlay — template owner Sawyer. One editable input positioned on the
// page by its NORMALIZED rect (-> % of the page box, so it lines up at any zoom).
// The active requirement's fields glow amber. Reads/writes through useDoc().
import type { CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import type { Field } from "@/lib/types";

export default function FieldOverlay({ field }: { field: Field }) {
  const { setFieldValue, active } = useDoc();
  const isActive = !!active?.fields.some((f) => f.id === field.id);

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

  const text =
    typeof field.value === "string" ? field.value : field.value == null ? "" : String(field.value);

  return (
    <input
      aria-label={field.label.en}
      value={text}
      placeholder={field.placeholder}
      onChange={(e) => setFieldValue(field.id, e.target.value)}
      style={style}
      className={`absolute rounded-sm px-1 text-[clamp(7px,1.3vw,14px)] text-slate-900 outline-none placeholder:text-slate-400 ${ring}`}
    />
  );
}
