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

  // VS Code Dark Style input outlines and backgrounds
  const ring = isActive
    ? "border-[#007acc] bg-[#2d2d2d] text-white z-40 scale-[1.01] shadow-md ring-1 ring-[#007acc]/45 animate-pulse-subtle"
    : "border-[#3c3c3c] bg-[#2d2d2d]/90 text-[#cccccc] z-10 opacity-75 hover:opacity-100 hover:border-[#555555]";

  // Checkbox Field
  if (field.kind === "checkbox") {
    return (
      <input
        type="checkbox"
        aria-label={field.label[lang]}
        checked={field.value === true}
        onChange={(e) => setFieldValue(field.id, e.target.checked)}
        style={style}
        className={`pointer-events-auto absolute cursor-pointer accent-[#007acc] bg-[#2d2d2d] transition-all ${ring}`}
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
        className={`pointer-events-auto absolute rounded-none border text-[clamp(7px,1.2vw,14px)] font-bold outline-none transition-all px-1.5 shadow-sm ${ring}`}
      >
        <option value="" className="bg-[#2d2d2d] text-[#cccccc]">--</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt} className="bg-[#2d2d2d] text-[#cccccc]">
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
        className={`pointer-events-auto absolute rounded-none border text-[clamp(7px,1.2vw,14px)] outline-none transition-all px-1.5 shadow-sm ${ring}`}
      />
    );
  }

  // Signature Field (Beautiful calligraphic toggle with VS Code dark styling)
  if (field.kind === "signature") {
    const isSigned = !!field.value;
    return (
      <button
        type="button"
        aria-label={field.label[lang]}
        onClick={() => setFieldValue(field.id, isSigned ? null : "Sawyer Cram")}
        style={style}
        className={`pointer-events-auto absolute rounded-none border flex items-center justify-between px-2 text-[clamp(6px,1.1vw,14px)] font-bold tracking-tight transition-all duration-350 shadow-sm ${
          isSigned
            ? "font-serif italic text-[#007acc] bg-[#2d2d2d] border-[#007acc]"
            : "text-[#858585] bg-[#252526] border-[#3c3c3c] border-dashed hover:bg-[#2d2d2d]"
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
      className={`pointer-events-auto absolute rounded-none border px-2 text-[clamp(7px,1.2vw,14px)] font-bold outline-none placeholder:text-[#555555] transition-all shadow-sm ${ring}`}
    />
  );
}
