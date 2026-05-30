// EXPORT — owned by Michael (backend, heavy track). Turns the filled DocumentModel
// back into a file: PDF (a generated, filled answers document via pdf-lib), JSON
// (the whole model), and CSV (one row per field). DOCX is a friendly stub for now
// (task 14 stretch). Pure client-side download — store.exportAs() calls exportDoc().
//
// buildExport() is split out, window-free, and synchronous-import-clean (no @/ value
// imports) so it can be unit-tested directly. exportDoc() wraps it with the download.
//
// NOTE: when the model carries the original uploaded PDF (doc.sourceFile, a data
// URL), "Export -> PDF" fills that real AcroForm (setText/check + flatten). When
// there's no source PDF (e.g. the SVG mock) it falls back to a clean generated PDF.
import type { DocumentModel, ExportFormat, Field, Lang } from "@/lib/types";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

function valueStr(v: Field["value"]): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function jsonContent(doc: DocumentModel): string {
  return JSON.stringify(doc, null, 2);
}

/** One row per Field: requirement, field name, label, value. */
function csvContent(doc: DocumentModel, lang: Lang): string {
  const esc = (c: string) => `"${String(c).replace(/"/g, '""')}"`;
  const rows: string[][] = [["Requirement", "Field name", "Label", "Value"]];
  for (const r of doc.requirements) {
    for (const f of r.fields) {
      rows.push([r.title[lang], f.name, f.label[lang], valueStr(f.value)]);
    }
  }
  return rows.map((row) => row.map(esc).join(",")).join("\n");
}

/** A generated, filled PDF of the document's steps + entered values. */
async function pdfBytes(doc: DocumentModel, lang: Lang): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const W = 612;
  const H = 792;
  const M = 50;
  const maxW = W - M * 2;
  let page = pdf.addPage([W, H]);
  let y = H - M;

  const draw = (
    text: string,
    opts: { size?: number; f?: typeof font; color?: ReturnType<typeof rgb>; indent?: number } = {},
  ) => {
    const size = opts.size ?? 11;
    const f = opts.f ?? font;
    const color = opts.color ?? rgb(0.1, 0.12, 0.16);
    const indent = opts.indent ?? 0;
    const x = M + indent;
    const words = (text || "").split(/\s+/);
    let lineStr = "";
    const flush = () => {
      if (y < M + size) {
        page = pdf.addPage([W, H]);
        y = H - M;
      }
      page.drawText(lineStr, { x, y, size, font: f, color });
      y -= size + 5;
      lineStr = "";
    };
    for (const w of words) {
      const trial = lineStr ? `${lineStr} ${w}` : w;
      if (lineStr && f.widthOfTextAtSize(trial, size) > maxW - indent) {
        flush();
        lineStr = w;
      } else {
        lineStr = trial;
      }
    }
    if (lineStr) flush();
  };

  draw(doc.docType[lang] || "Document", { size: 18, f: bold });
  draw(doc.fileName, { size: 9, color: rgb(0.4, 0.45, 0.5) });
  y -= 8;
  if (doc.summary[lang]) {
    draw(doc.summary[lang], { size: 10, color: rgb(0.25, 0.28, 0.33) });
    y -= 8;
  }
  for (const r of doc.requirements) {
    draw(`${r.order}. ${r.title[lang]}`, { size: 12, f: bold });
    for (const fld of r.fields) {
      draw(`${fld.label[lang]}: ${valueStr(fld.value)}`, { size: 10, indent: 16 });
    }
    y -= 4;
  }
  return pdf.save();
}

/** Fill the ORIGINAL uploaded PDF's AcroForm from the model's values, then
 *  flatten. Returns null when there's no source PDF or no fillable form, so the
 *  caller falls back to the generated PDF. */
async function fillOriginalPdf(doc: DocumentModel): Promise<Uint8Array | null> {
  const src = doc.sourceFile;
  if (!src || !src.startsWith("data:application/pdf")) return null;
  try {
    const b64 = src.replace(/^data:.*?;base64,/, "");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const pdf = await PDFDocument.load(bytes);
    const form = pdf.getForm();
    if (form.getFields().length === 0) return null;
    for (const r of doc.requirements) {
      for (const fld of r.fields) {
        try {
          if (fld.kind === "checkbox") {
            const cb = form.getCheckBox(fld.name);
            if (fld.value === true) cb.check();
            else cb.uncheck();
          } else {
            form.getTextField(fld.name).setText(valueStr(fld.value));
          }
        } catch {
          // field name isn't in this PDF's AcroForm — skip it
        }
      }
    }
    form.flatten();
    return await pdf.save();
  } catch (e) {
    console.error("fill-original failed, using generated PDF:", e);
    return null;
  }
}

export interface ExportArtifact {
  filename: string;
  mime: string;
  data: string | Uint8Array;
}

/** Build the export artifact (no DOM) — unit-testable. Throws for docx (stub). */
export async function buildExport(
  doc: DocumentModel,
  format: ExportFormat,
  lang: Lang = "en",
): Promise<ExportArtifact> {
  const base = (doc.fileName || "document").replace(/\.[^.]+$/, "");
  switch (format) {
    case "json":
      return { filename: `${base}.json`, mime: "application/json", data: jsonContent(doc) };
    case "csv":
      return { filename: `${base}.csv`, mime: "text/csv", data: csvContent(doc, lang) };
    case "pdf": {
      const original = await fillOriginalPdf(doc);
      const data = original ?? (await pdfBytes(doc, lang));
      return { filename: `${base}-filled.pdf`, mime: "application/pdf", data };
    }
    case "docx":
      throw new Error("docx-coming-soon");
    default:
      throw new Error(`Unknown export format: ${format}`);
  }
}

/** Build the artifact and trigger a client-side download. Called by store.exportAs(). */
export async function exportDoc(
  doc: DocumentModel,
  format: ExportFormat,
  lang: Lang = "en",
): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const { filename, mime, data } = await buildExport(doc, format, lang);
    const blob = new Blob([data as unknown as BlobPart], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    if (format === "docx") {
      alert("DOCX export is coming soon — use PDF, JSON, or CSV for now.");
      return;
    }
    console.error("export failed", e);
    alert("Sorry — that export didn't work. Try another format.");
  }
}
