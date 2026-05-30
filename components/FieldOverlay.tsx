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

  // Base styling for the active vs inactive fields
  const ring = isActive
    ? "ring-2 ring-brand border-brand bg-brand-soft/90 z-40 scale-[1.01]"
    : "ring-1 ring-slate-300 border-slate-300 bg-white/85 z-10 opacity-70 hover:opacity-90 hover:ring-slate-400";

  // Checkbox Field
  if (field.kind === "checkbox") {
    return (
      <input
        type="checkbox"
        aria-label={field.label[lang]}
        checked={field.value === true}
        onChange={(e) => setFieldValue(field.id, e.target.checked)}
        style={style}
        className={`pointer-events-auto absolute cursor-pointer accent-brand transition-all ${ring}`}
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
        className={`pointer-events-auto absolute rounded-md px-1 text-[clamp(7px,1.2vw,14px)] text-slate-900 outline-none transition-all ${ring}`}
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
        className={`pointer-events-auto absolute rounded-md px-1 text-[clamp(7px,1.2vw,14px)] text-slate-900 outline-none transition-all ${ring}`}
      />
    );
  }

  // Signature Field (Click to sign / toggle)
  if (field.kind === "signature") {
    const isSigned = !!field.value;
    return (
      <button
        type="button"
        aria-label={field.label[lang]}
        onClick={() => setFieldValue(field.id, isSigned ? null : "Sawyer Cram")}
        style={style}
        className={`pointer-events-auto absolute rounded-md flex items-center justify-center px-1.5 text-[clamp(6px,1.1vw,14px)] border transition-all ${
          isSigned
            ? "font-serif italic text-blue-600 bg-blue-50 border-blue-300 font-bold"
            : "text-slate-400 bg-slate-50/90 border-slate-300 border-dashed hover:bg-slate-100"
        } ${ring}`}
      >
        {isSigned ? "Sawyer Cram" : lang === "es" ? "Firmar aquí" : "Sign here"}
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
      className={`pointer-events-auto absolute rounded-md px-1.5 text-[clamp(7px,1.2vw,14px)] text-slate-900 outline-none placeholder:text-slate-400 border transition-all ${ring}`}
    />
  );
}
