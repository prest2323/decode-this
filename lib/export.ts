// EXPORT — template owner Michael (he'll add real pdf-lib fill + flatten + DOCX).
// The template ships working JSON + CSV export and a readable text fallback so
// the "data is exportable" promise is demoable today. Pure client-side download.
import type { DocumentModel, ExportFormat, Field, Lang } from "@/lib/types";

function allFields(doc: DocumentModel): Field[] {
  return doc.requirements.flatMap((r) => r.fields);
}

function valueStr(v: Field["value"]): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

export function buildExport(
  doc: DocumentModel,
  format: ExportFormat,
  lang: Lang = "en",
): { filename: string; mime: string; content: string } {
  const base = (doc.fileName || "document").replace(/\.[^.]+$/, "");

  if (format === "json") {
    const data = {
      docType: doc.docType[lang],
      fileName: doc.fileName,
      fields: allFields(doc).map((f) => ({
        name: f.name,
        label: f.label[lang],
        value: f.value,
      })),
      checklist: doc.requirements.map((r) => ({
        step: r.order,
        title: r.title[lang],
        type: r.type,
        status: r.status,
      })),
    };
    return {
      filename: `${base}.json`,
      mime: "application/json",
      content: JSON.stringify(data, null, 2),
    };
  }

  if (format === "csv") {
    const rows: string[][] = [
      ["Field", "Value"],
      ...allFields(doc).map((f) => [f.label[lang], valueStr(f.value)]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    return { filename: `${base}.csv`, mime: "text/csv", content: csv };
  }

  // pdf / docx: TODO (Michael — pdf-lib fill + flatten / DOCX template).
  // Until then, export a clean readable text snapshot so the button always works.
  const txt = allFields(doc)
    .map((f) => `${f.label[lang]}: ${valueStr(f.value)}`)
    .join("\n");
  return { filename: `${base}.txt`, mime: "text/plain", content: txt };
}

export function exportDoc(
  doc: DocumentModel,
  format: ExportFormat,
  lang: Lang = "en",
): void {
  const { filename, mime, content } = buildExport(doc, format, lang);
  if (typeof window === "undefined") return;
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
