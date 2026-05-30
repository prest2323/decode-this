"use client";
// FieldOverlay — template owner Sawyer. One editable input positioned on the
// page by its NORMALIZED rect (-> % of the page box, so it lines up at any zoom).
// The active requirement's fields glow with brand blue, while inactive ones are dimmed.
// Reads/writes through useDoc().
import type { CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import type { Field } from "@/lib/types";

export default function FieldOverlay({ field }: { field: Field }) {
  const { setFieldValue, active, lang } = useDoc();
  const isActive = !!active?.fields.some((f) => f.id === field.id);

  const style: CSSProperties = {
    left: `${field.rect.x * 100}%`,
    top: `${field.rect.y * 100}%`,
    width: `${field.rect.w * 100}%`,
    height: `${field.rect.h * 100}%`,
  };

  // Flat enterprise-style focus and inactive outlines
  const ring = isActive
    ? "border-2 border-slate-900 bg-slate-50 z-40 scale-[1.005] shadow-sm animate-pulse-subtle"
    : "border border-slate-250 bg-white/95 z-10 opacity-80 hover:opacity-100 hover:border-slate-400";

  // Checkbox Field
  if (field.kind === "checkbox") {
    return (
      <input
        type="checkbox"
        aria-label={field.label[lang]}
        checked={field.value === true}
        onChange={(e) => setFieldValue(field.id, e.target.checked)}
        style={style}
        className={`pointer-events-auto absolute cursor-pointer accent-slate-900 transition-all ${ring}`}
      />
    );
  }

  // Radio Field (Rendered as an elegant select dropdown to fit within the box)
  if (field.kind === "radio") {
    return (
      <select
        aria-label={field.label[lang]}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={(e) => setFieldValue(field.id, e.target.value)}
        style={style}
        className={`pointer-events-auto absolute rounded border text-[clamp(7px,1.2vw,14px)] font-bold text-slate-800 outline-none transition-all px-1 shadow-sm ${ring}`}
      >
        <option value="">--</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // Date Field
  if (field.kind === "date") {
    return (
      <input
        type="date"
        aria-label={field.label[lang]}
        value={typeof field.value === "string" ? field.value : ""}
        onChange={(e) => setFieldValue(field.id, e.target.value)}
        style={style}
        className={`pointer-events-auto absolute rounded border text-[clamp(7px,1.2vw,14px)] text-slate-800 outline-none transition-all px-1 shadow-sm ${ring}`}
      />
    );
  }

  // Signature Field (Beautiful calligraphic toggle with cream frosted paper style)
  if (field.kind === "signature") {
    const isSigned = !!field.value;
    return (
      <button
        type="button"
        aria-label={field.label[lang]}
        onClick={() => setFieldValue(field.id, isSigned ? null : "Sawyer Cram")}
        style={style}
        className={`pointer-events-auto absolute rounded border flex items-center justify-between px-2 text-[clamp(6px,1.1vw,14px)] font-bold tracking-tight transition-all duration-350 shadow-sm ${
          isSigned
            ? "font-serif italic text-slate-900 bg-slate-50 border-slate-900"
            : "text-slate-400 bg-slate-50 border-slate-350 border-dashed hover:bg-slate-100"
        } ${ring}`}
      >
        <span className="truncate">
          {isSigned ? "Sawyer Cram" : lang === "es" ? "Firmar aquí" : "Sign here"}
        </span>
        <span className="text-[1.1em] opacity-80 select-none">
          {isSigned ? "✍️" : "🖋️"}
        </span>
      </button>
    );
  }

  // Text or Number Field
  const text =
    typeof field.value === "string" ? field.value : field.value == null ? "" : String(field.value);

  return (
    <input
      type={field.kind === "number" ? "number" : "text"}
      aria-label={field.label[lang]}
      value={text}
      placeholder={field.placeholder ?? field.label[lang]}
      onChange={(e) => setFieldValue(field.id, e.target.value)}
      style={style}
      className={`pointer-events-auto absolute rounded border px-1.5 text-[clamp(7px,1.2vw,14px)] font-bold text-slate-800 outline-none placeholder:text-slate-400 transition-all shadow-sm ${ring}`}
    />
  );
}
