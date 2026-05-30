"use client";
// FieldOverlay — owner Sawyer. One editable control positioned ON the page by
// its NORMALIZED rect (-> % of the page box, so it lines up at any zoom).
// Bilingual (label[lang]). The active requirement's fields light up in the
// brand color and lift above the spotlight dim; the rest stay calm and recede
// behind it. Reads/writes through useDoc().
import type { CSSProperties } from "react";
import { useDoc } from "@/lib/store";
import type { Field } from "@/lib/types";

export default function FieldOverlay({ field }: { field: Field }) {
  const { setFieldValue, active, lang } = useDoc();
  const isActive = !!active?.fields.some((f) => f.id === field.id);
  const label = field.label[lang];

  const style: CSSProperties = {
    left: `${field.rect.x * 100}%`,
    top: `${field.rect.y * 100}%`,
    width: `${field.rect.w * 100}%`,
    height: `${field.rect.h * 100}%`,
  };

  // Active fields sit ABOVE the spotlight dim (z-40 > the dim's z-30) so they
  // stay bright and editable; inactive fields sit below it (z-10) and recede.
  const base = "pointer-events-auto absolute rounded-sm outline-none transition-all";
  const tone = isActive
    ? "z-40 bg-brand-soft ring-2 ring-brand shadow-sm"
    : "z-10 bg-surface/85 ring-1 ring-line opacity-90";
  const textSize = "text-[clamp(7px,1.3vw,14px)]";

  // Checkbox — a tickable box, not a text field.
  if (field.kind === "checkbox") {
    return (
      <input
        type="checkbox"
        aria-label={label}
        checked={field.value === true}
        onChange={(e) => setFieldValue(field.id, e.target.checked)}
        style={style}
        className={`${base} cursor-pointer accent-brand ${tone}`}
      />
    );
  }

  // Radio/options — one normalized rect can't host a positioned radio GROUP, so
  // an on-document dropdown is the pragmatic editable control for an options field.
  if (field.kind === "radio" && field.options?.length) {
    const v = typeof field.value === "string" ? field.value : "";
    return (
      <select
        aria-label={label}
        value={v}
        onChange={(e) => setFieldValue(field.id, e.target.value)}
        style={style}
        className={`${base} ${textSize} px-1 text-ink ${tone}`}
      >
        <option value="" disabled>
          {field.placeholder ?? label}
        </option>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  // Everything else is a text-like input: text, number, date, signature.
  const text =
    typeof field.value === "string"
      ? field.value
      : field.value == null
        ? ""
        : String(field.value);
  const isSignature = field.kind === "signature";

  return (
    <input
      type={field.kind === "date" ? "date" : "text"}
      inputMode={field.kind === "number" ? "numeric" : undefined}
      aria-label={label}
      value={text}
      placeholder={isSignature ? `✍ ${label}` : (field.placeholder ?? label)}
      onChange={(e) => setFieldValue(field.id, e.target.value)}
      style={style}
      className={`${base} ${textSize} px-1 text-ink placeholder:text-muted ${
        isSignature ? "font-[cursive] italic" : ""
      } ${tone}`}
    />
  );
}
