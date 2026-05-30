// EXTRACT — owned by Michael (backend, heavy track). Turns an uploaded document
// into a DocumentModel. Gemini (default) / Anthropic (fallback) read the file
// multimodally and return JSON; the SHARED normalizeDoc() in lib/ai.ts is the
// single trust boundary every reply passes through (clamps rects, fills es,
// derives the grouped spotlight, guarantees one active step). With no key — or on
// ANY failure — we return the SBA mock, so the demo can never hang on the network.
//
// THE IMPRESSIVE WIN — REAL FIELD COORDINATES: when the upload is an AcroForm PDF
// we read each form field's real widget rectangle with pdf-lib, normalize it to
// [0..1] top-left, (a) feed the field inventory to the model so it reuses the REAL
// field names, then (b) stamp those real rects back onto the model's fields. The
// grouped spotlight then lands on the actual boxes of a real uploaded form, not
// just the mock. Falls back gracefully when a PDF has no AcroForm.
//
// NOTE on pages: the model returns docType/summary/topFlags/requirements, NOT the
// rendered page images. Rects are normalized [0..1] so the canvas can overlay them
// on whatever it renders from the original upload. For an image upload the upload
// IS the page; PDFs get a placeholder until client-side pdfjs render (Sawyer).
import type { Schema } from "@google/genai";
import {
  PDFDocument,
  PDFCheckBox,
  PDFRadioGroup,
  PDFSignature,
  PDFDropdown,
  PDFOptionList,
  PDFButton,
} from "pdf-lib";
import { createHash } from "node:crypto";
import type {
  AnalyzeRequest,
  Difficulty,
  DocPage,
  DocumentModel,
  Field,
  Rect,
  Requirement,
} from "@/lib/types";
import {
  provider,
  geminiClient,
  anthropicClient,
  GEMINI_MODEL,
  ANTHROPIC_MODEL,
  normalizeDoc,
} from "@/lib/ai";
import { MOCK_DOC } from "@/lib/mock";
import { EXTRACT_SYSTEM, extractSchema } from "@/lib/prompt";

interface ParsedFile {
  mimeType: string;
  data: string; // base64 (binary) or raw text
  isText: boolean;
}

/** Split a base64 data URL into {mimeType, data}; tolerate raw base64 / raw text. */
function parseFile(req: AnalyzeRequest): ParsedFile {
  const m = req.file.match(/^data:(.+?);base64,([\s\S]*)$/);
  if (m) return { mimeType: m[1], data: m[2], isText: false };
  if (req.mime && !req.mime.startsWith("text")) {
    return { mimeType: req.mime, data: req.file.replace(/^data:.*?,/, ""), isText: false };
  }
  return { mimeType: req.mime || "text/plain", data: req.file, isText: true };
}

// ============================================================================
//  RELIABILITY — timeout + one retry (shared deadline) + identical-doc cache
// ============================================================================

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Reject if `p` hasn't settled within `ms`. The late settlement of the original
 *  promise is swallowed (handlers attached) so there's no unhandled rejection. */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** Run `fn`, retrying once with backoff on failure, under a TOTAL time budget so
 *  the route's maxDuration is never blown (a hung first attempt leaves no time
 *  for a second — we fall through to the mock instead). */
async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { tries?: number; totalMs: number; backoffMs?: number; label: string },
): Promise<T> {
  const { tries = 2, totalMs, backoffMs = 800, label } = opts;
  const deadline = Date.now() + totalMs;
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      return await withTimeout(fn(), remaining, label);
    } catch (e) {
      lastErr = e;
      const wait = Math.min(backoffMs * (i + 1), Math.max(0, deadline - Date.now()));
      if (i < tries - 1 && wait > 0) await sleep(wait);
    }
  }
  throw lastErr ?? new Error(`${label} failed`);
}

// In-memory cache of identical-doc analyses (per server instance). Keyed by the
// provider/model + a content hash of the file, so re-uploading the SAME document
// (or the eval hitting the same sample repeatedly) returns instantly. Only
// successful REAL analyses are cached — never the mock fallback, so a transient
// failure doesn't get pinned. Capacity-bounded FIFO; values hold no user input.
const analysisCache = new Map<string, DocumentModel>();
const ANALYSIS_CACHE_MAX = 24;
function analysisKey(file: string): string {
  const hash = createHash("sha256").update(file).digest("hex");
  return `${provider()}|${GEMINI_MODEL}|${ANTHROPIC_MODEL}|${hash}`;
}
function cacheGet(key: string): DocumentModel | undefined {
  return analysisCache.get(key);
}
function cacheSet(key: string, model: DocumentModel): void {
  analysisCache.set(key, model);
  if (analysisCache.size > ANALYSIS_CACHE_MAX) {
    const oldest = analysisCache.keys().next().value;
    if (oldest !== undefined) analysisCache.delete(oldest);
  }
}

// ============================================================================
//  REAL ACROFORM GEOMETRY (pdf-lib) — the signature feature
// ============================================================================

/** One fillable field discovered in a PDF's AcroForm, with a normalized rect. */
export interface AcroFieldInfo {
  name: string;
  kind: Field["kind"];
  /** Normalized [0..1], origin top-left, accounting for page rotation. */
  rect: Rect;
  required: boolean;
  options?: string[];
}

/** Map an AcroForm widget rect (PDF user space, origin bottom-left) to a
 *  normalized [0..1] top-left rect on the DISPLAYED page, honoring /Rotate.
 *  Corners are mapped individually then min/maxed, so any rotation and any
 *  corner ordering produce a correct, positive-size rect. */
function widgetRectToNorm(
  raw: { x: number; y: number; width: number; height: number },
  pw: number,
  ph: number,
  rot: number,
): Rect | null {
  if (!(pw > 0) || !(ph > 0)) return null;
  const x0 = raw.x;
  const y0 = raw.y;
  const x1 = raw.x + raw.width;
  const y1 = raw.y + raw.height;
  const r = ((rot % 360) + 360) % 360;
  const map = (X: number, Y: number): { nx: number; ny: number } => {
    switch (r) {
      case 90:
        return { nx: Y / ph, ny: X / pw };
      case 180:
        return { nx: (pw - X) / pw, ny: Y / ph };
      case 270:
        return { nx: (ph - Y) / ph, ny: (pw - X) / pw };
      default:
        return { nx: X / pw, ny: (ph - Y) / ph };
    }
  };
  const a = map(x0, y0);
  const b = map(x1, y1);
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  return {
    page: 0, // set by the caller
    x: clamp01(Math.min(a.nx, b.nx)),
    y: clamp01(Math.min(a.ny, b.ny)),
    w: clamp01(Math.abs(b.nx - a.nx)),
    h: clamp01(Math.abs(b.ny - a.ny)),
  };
}

/** Which page (0-based) a widget annotation lives on. Prefers the /P reference;
 *  falls back to scanning each page's annotations, then to page 0. */
function resolvePageIndex(
  widget: { P?: () => unknown; dict?: unknown },
  pages: ReturnType<PDFDocument["getPages"]>,
  ctx: PDFDocument["context"],
): number {
  const ref = typeof widget.P === "function" ? widget.P() : undefined;
  if (ref) {
    const key = String(ref);
    const i = pages.findIndex((p) => String(p.ref) === key);
    if (i >= 0) return i;
  }
  const wdict = widget.dict;
  for (let i = 0; i < pages.length; i++) {
    let annots: { size?: () => number; get?: (n: number) => unknown } | undefined;
    try {
      annots = pages[i].node.Annots() as typeof annots;
    } catch {
      annots = undefined;
    }
    if (!annots || typeof annots.size !== "function" || typeof annots.get !== "function") continue;
    for (let j = 0; j < annots.size(); j++) {
      let resolved: unknown;
      try {
        resolved = ctx.lookup(annots.get(j) as never);
      } catch {
        resolved = undefined;
      }
      if (resolved && resolved === wdict) return i;
    }
  }
  return 0;
}

function kindOfAcroField(field: unknown): Field["kind"] | null {
  if (field instanceof PDFCheckBox) return "checkbox";
  if (field instanceof PDFRadioGroup) return "radio";
  if (field instanceof PDFSignature) return "signature";
  if (field instanceof PDFButton) return null; // push buttons aren't inputs — skip
  return "text"; // text / dropdown / option list — render as text (+ options)
}

/**
 * Pull every fillable field's real widget rectangle from a PDF's AcroForm.
 * Returns [] (never throws) for image uploads, encrypted/garbage PDFs, or PDFs
 * with no form — the caller then keeps the model's own rects.
 */
export async function extractAcroFields(input: Uint8Array | string): Promise<AcroFieldInfo[]> {
  let bytes: Uint8Array;
  if (typeof input === "string") {
    const b64 = input.replace(/^data:.*?;base64,/, "");
    bytes = Uint8Array.from(Buffer.from(b64, "base64"));
  } else {
    bytes = input;
  }
  let pdf: PDFDocument;
  try {
    pdf = await PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  } catch {
    return [];
  }
  let fields;
  try {
    fields = pdf.getForm().getFields();
  } catch {
    return [];
  }
  if (!fields.length) return [];
  const pages = pdf.getPages();
  if (!pages.length) return [];
  const ctx = pdf.context;
  const out: AcroFieldInfo[] = [];

  for (const field of fields) {
    let name = "";
    try {
      name = field.getName() || "";
    } catch {
      name = "";
    }
    if (!name) continue;
    const kind = kindOfAcroField(field);
    if (!kind) continue;

    let options: string[] | undefined;
    if (field instanceof PDFRadioGroup || field instanceof PDFDropdown || field instanceof PDFOptionList) {
      try {
        const o = field.getOptions();
        if (Array.isArray(o) && o.length) options = o.map(String);
      } catch {
        /* ignore */
      }
    }
    let required = false;
    try {
      required = field.isRequired();
    } catch {
      required = false;
    }

    let widgets: ReturnType<typeof field.acroField.getWidgets>;
    try {
      widgets = field.acroField.getWidgets();
    } catch {
      widgets = [];
    }
    for (const w of widgets) {
      let raw: { x: number; y: number; width: number; height: number };
      try {
        raw = w.getRectangle();
      } catch {
        continue;
      }
      const pageIndex = resolvePageIndex(
        w as unknown as { P?: () => unknown; dict?: unknown },
        pages,
        ctx,
      );
      const page = pages[pageIndex];
      const { width: pw, height: ph } = page.getSize();
      const rot = page.getRotation().angle || 0;
      const rect = widgetRectToNorm(raw, pw, ph, rot);
      if (!rect) continue;
      if (rect.w <= 0 || rect.h <= 0) continue; // hidden / zero-size widget
      rect.page = pageIndex;
      out.push({ name, kind, rect, required, options });
    }
  }
  return out;
}

const normName = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Compact, capped text block listing the real form fields so the model reuses
 *  the EXACT AcroForm names (→ a perfect name-join in attachRealRects). */
function acroInventoryHint(acro: AcroFieldInfo[]): string {
  if (!acro.length) return "";
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const f of acro) {
    if (seen.has(f.name)) continue;
    seen.add(f.name);
    lines.push(
      `- "${f.name}" (${f.kind}) on page ${f.rect.page} near [x=${f.rect.x.toFixed(2)}, y=${f.rect.y.toFixed(2)}]`,
    );
    if (lines.length >= 80) break;
  }
  return (
    `\n\nFORM FIELD INVENTORY — these are the document's REAL fillable fields, extracted from its AcroForm. ` +
    `For every "fill-field" requirement, set each Field.name to the EXACT name shown here (copy it verbatim) so the app can map your output onto the real page. ` +
    `Still group related fields (e.g. all the address parts) into ONE requirement as instructed; you do not need to be precise about rects — the app uses these real coordinates.\n` +
    lines.join("\n")
  );
}

/** Padded bounding box of a set of field rects on their shared page = the
 *  grouped spotlight. Mirrors lib/ai + lib/mock padding so grouping is uniform. */
const SPOTLIGHT_PAD = 0.012;
function bboxOf(fields: Field[]): Rect | null {
  if (!fields.length) return null;
  const page = fields[0].rect.page;
  const same = fields.filter((f) => f.rect.page === page);
  if (!same.length) return null;
  const minX = Math.min(...same.map((f) => f.rect.x));
  const minY = Math.min(...same.map((f) => f.rect.y));
  const maxX = Math.max(...same.map((f) => f.rect.x + f.rect.w));
  const maxY = Math.max(...same.map((f) => f.rect.y + f.rect.h));
  const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
  return {
    page,
    x: clamp01(minX - SPOTLIGHT_PAD),
    y: clamp01(minY - SPOTLIGHT_PAD),
    w: clamp01(maxX - minX + SPOTLIGHT_PAD * 2),
    h: clamp01(maxY - minY + SPOTLIGHT_PAD * 2),
  };
}

/**
 * Stamp the REAL AcroForm widget rects onto the model's fields by name (exact,
 * then normalized). Also corrects each matched field's kind to the widget's true
 * type and re-derives every fill-field spotlight from the real geometry.
 */
export function attachRealRects(model: DocumentModel, acro: AcroFieldInfo[]): DocumentModel {
  if (!acro.length) return model;
  const byExact = new Map<string, AcroFieldInfo>();
  const byNorm = new Map<string, AcroFieldInfo>();
  for (const f of acro) {
    if (!byExact.has(f.name)) byExact.set(f.name, f);
    const nk = normName(f.name);
    if (nk && !byNorm.has(nk)) byNorm.set(nk, f);
  }
  let matched = 0;
  const requirements = model.requirements.map((r) => {
    if (r.type !== "fill-field" || !r.fields.length) return r;
    const fields = r.fields.map((field) => {
      const hit = byExact.get(field.name) ?? byNorm.get(normName(field.name));
      if (!hit) return field;
      matched++;
      return { ...field, rect: { ...hit.rect }, kind: hit.kind, options: hit.options ?? field.options };
    });
    return { ...r, fields, spotlight: bboxOf(fields) ?? r.spotlight };
  });
  // Coverage is useful signal but must never leak field VALUES — names only.
  console.log(`acroform: matched ${matched} model field(s) to real widget rects (of ${acro.length} form fields)`);
  return { ...model, requirements };
}

// ============================================================================
//  GROUPING + DIFFICULTY + ORDER (restores the task-5 pass that the
//  shared-normalizer dedup dropped; runs AFTER normalizeDoc on live output only)
// ============================================================================

const ADDR_TOKEN = /addr|street|\bcity\b|\bstate\b|\bzip\b|postal|calle|ciudad|estado|c[oó]digo|direcci/i;
const NAMEPART_TOKEN = /(first|last|middle|given|family)[_\s-]*name|name[_\s-]*(first|last|middle)|primer.*nombre|apellido/i;

function fieldText(f: Field): string {
  return `${f.name} ${f.label.en} ${f.label.es}`;
}
/** A requirement is "address-class" when EVERY field looks like an address part. */
function isAddressClass(r: Requirement): boolean {
  return r.type === "fill-field" && r.fields.length > 0 && r.fields.every((f) => ADDR_TOKEN.test(fieldText(f)));
}
function isNamePartClass(r: Requirement): boolean {
  return r.type === "fill-field" && r.fields.length > 0 && r.fields.every((f) => NAMEPART_TOKEN.test(fieldText(f)));
}
function reqPage(r: Requirement): number {
  return r.fields[0]?.rect.page ?? r.spotlight?.page ?? 0;
}
/** Vertical gap between two stacked fill-field blocks (normalized). A large gap
 *  ⇒ genuinely different blocks ⇒ don't merge. */
function verticalGap(a: Requirement, b: Requirement): number {
  const ab = bboxOf(a.fields);
  const bb = bboxOf(b.fields);
  if (!ab || !bb) return 1;
  return Math.max(bb.y - (ab.y + ab.h), ab.y - (bb.y + bb.h));
}

/**
 * (a) Safety-net merge: collapse CONSECUTIVE same-unit fill-fields (an address
 * block, or a split first/last name) the model failed to group — but only when
 * they sit on the same page and are vertically adjacent, so two distinct address
 * blocks never merge. Idempotent on an already-grouped doc (e.g. the SBA mock).
 */
function mergeAdjacent(reqs: Requirement[]): Requirement[] {
  const out: Requirement[] = [];
  for (const r of reqs) {
    const prev = out[out.length - 1];
    const sameClass =
      prev &&
      reqPage(prev) === reqPage(r) &&
      ((isAddressClass(prev) && isAddressClass(r)) || (isNamePartClass(prev) && isNamePartClass(r))) &&
      verticalGap(prev, r) < 0.08;
    if (sameClass) {
      const fields = [...prev.fields, ...r.fields];
      out[out.length - 1] = {
        ...prev,
        fields,
        flags: [...prev.flags, ...r.flags],
        spotlight: bboxOf(fields),
      };
    } else {
      out.push(r);
    }
  }
  return out;
}

const DIFF_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const RANK_DIFF: Difficulty[] = ["easy", "medium", "hard"];
function maxDiff(a: Difficulty, b: Difficulty): Difficulty {
  return RANK_DIFF[Math.max(DIFF_RANK[a], DIFF_RANK[b])];
}
function typeBaseline(r: Requirement): Difficulty {
  switch (r.type) {
    case "pay-fee":
      return "hard";
    case "gather-document":
    case "external-action":
    case "sign":
      return "medium";
    default: {
      // fill-field: a lone simple text box is easy; signatures / many inputs skew up.
      const heavy = r.fields.some((f) => f.kind === "signature");
      return heavy || r.fields.length >= 4 ? "medium" : "easy";
    }
  }
}
function flagSeverity(r: Requirement): Difficulty {
  let d: Difficulty = "easy";
  for (const f of r.flags) {
    if (f.kind === "legal-risk" || f.kind === "background-check" || f.kind === "scam") d = maxDiff(d, "hard");
    else if (f.kind === "deadline" || f.kind === "fee") d = maxDiff(d, "medium");
  }
  return d;
}
function scoreDifficulty(r: Requirement): Difficulty {
  return maxDiff(maxDiff(r.difficulty, typeBaseline(r)), flagSeverity(r));
}

// Tour rank: prerequisites first, then on-page fills, then pay, then sign last.
const TYPE_RANK: Record<Requirement["type"], number> = {
  "gather-document": 0,
  "external-action": 1,
  "fill-field": 2,
  "pay-fee": 3,
  sign: 4,
};

/**
 * The full grouping/difficulty/order pass, applied to LIVE model output after
 * the shared normalizeDoc. Merges adjacent same-unit fill-fields, scores
 * difficulty (max of model / type-baseline / flag-severity), and orders the tour
 * prerequisites → fills (easy→hard, top→bottom) → pay → sign, reassigning `order`
 * and putting the first step active.
 */
export function groupAndOrder(input: Requirement[]): Requirement[] {
  const merged = mergeAdjacent(input).map((r) => ({ ...r, difficulty: scoreDifficulty(r) }));
  const sorted = merged.slice().sort((a, b) => {
    if (TYPE_RANK[a.type] !== TYPE_RANK[b.type]) return TYPE_RANK[a.type] - TYPE_RANK[b.type];
    if (DIFF_RANK[a.difficulty] !== DIFF_RANK[b.difficulty]) return DIFF_RANK[a.difficulty] - DIFF_RANK[b.difficulty];
    const ay = a.spotlight?.y ?? 1;
    const by = b.spotlight?.y ?? 1;
    if (ay !== by) return ay - by;
    return (a.spotlight?.x ?? 1) - (b.spotlight?.x ?? 1);
  });
  return sorted.map((r, i) => ({ ...r, order: i + 1, status: i === 0 ? "active" : "todo" }));
}

// ============================================================================
//  PROVIDER CALLS
// ============================================================================

/** Recursively lowercase every `type` so the Gemini (Type-enum) schema becomes a
 *  plain JSON Schema for Anthropic's tool input_schema. */
function toJsonSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toJsonSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(node as Record<string, unknown>)) {
      out[k] = k === "type" && typeof val === "string" ? val.toLowerCase() : toJsonSchema(val);
    }
    return out;
  }
  return node;
}

async function extractWithGemini(parsed: ParsedFile, systemText: string): Promise<unknown> {
  const { mimeType, data, isText } = parsed;
  const parts = isText
    ? [{ text: systemText }, { text: data }]
    : [{ text: systemText }, { inlineData: { mimeType, data } }];
  const res = await geminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      // extractSchema is hand-built with the Type enum; cast to the SDK's Schema.
      responseSchema: extractSchema as unknown as Schema,
      temperature: 0.1,
    },
  });
  return JSON.parse(res.text ?? "{}");
}

async function extractWithAnthropic(parsed: ParsedFile, systemText: string): Promise<unknown> {
  const { mimeType, data, isText } = parsed;
  const client = anthropicClient();
  const fileBlock = isText
    ? { type: "text" as const, text: `Document text:\n"""${data}"""` }
    : mimeType === "application/pdf"
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mimeType as "image/jpeg" | "image/png", data } };
  const msg = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    temperature: 0.1,
    tools: [
      {
        name: "emit_document_model",
        description: "Return the structured DocumentModel for the document.",
        input_schema: toJsonSchema(extractSchema) as { type: "object" },
      },
    ],
    tool_choice: { type: "tool", name: "emit_document_model" },
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: systemText }] as never }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  return block && block.type === "tool_use" ? block.input : {};
}

// ============================================================================
//  PAGES — give the canvas something to render (the model returns no images)
// ============================================================================

// For an IMAGE upload the upload IS the page — attach it with its real pixel size
// so the aspect ratio (and the normalized overlays) line up. PDFs need client-side
// pdfjs (Sawyer); until then a neutral placeholder keeps the canvas from crashing
// on an empty pages[].
const PLACEHOLDER_PAGE =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="850" height="1100"><rect width="850" height="1100" fill="#f1f5f9"/><text x="425" y="545" font-family="Arial, sans-serif" font-size="22" fill="#64748b" text-anchor="middle">Document preview unavailable — fields below</text></svg>',
  );

/** Read pixel dimensions straight from a base64 PNG/JPEG header (no decoding). */
function imageDims(mimeType: string, base64: string): { width: number; height: number } {
  const def = { width: 850, height: 1100 };
  try {
    const buf = Buffer.from(base64, "base64");
    if (mimeType.includes("png") && buf.length > 24) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) {
      let o = 2;
      while (o + 9 < buf.length) {
        if (buf[o] !== 0xff) {
          o++;
          continue;
        }
        const marker = buf[o + 1];
        // Start-of-Frame markers carry the image dimensions.
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { height: buf.readUInt16BE(o + 5), width: buf.readUInt16BE(o + 7) };
        }
        o += 2 + buf.readUInt16BE(o + 2);
      }
    }
  } catch {
    return def;
  }
  return def;
}

// Draw a CLEAN form page from the model's own fields (mock-style), so a blurry
// photo is replaced by a crisp, readable reconstruction whose boxes line up exactly
// with the overlays. Generated entirely from the AI's analysis — no template assets.
const SYNTH_W = 850;
const SYNTH_H = 1100;
function escSvg(s: string): string {
  return s.replace(/[<>&]/g, (c) => (c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&amp;"));
}
function synthPageSvg(model: DocumentModel, fields: Field[], pageIdx: number): string {
  const boxes = fields
    .map((f) => {
      const x = f.rect.x * SYNTH_W;
      const y = f.rect.y * SYNTH_H;
      const w = Math.max(8, f.rect.w * SYNTH_W);
      const h = Math.max(14, f.rect.h * SYNTH_H);
      const label = escSvg(f.label.en || f.name);
      return (
        `<text x="${x.toFixed(1)}" y="${(y - 5).toFixed(1)}" font-size="12" fill="#475569" font-family="Arial, sans-serif">${label}${f.required ? " *" : ""}</text>` +
        `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" rx="3"/>`
      );
    })
    .join("");
  const header =
    `<text x="40" y="54" font-size="20" font-weight="700" fill="#0f172a" font-family="Arial, sans-serif">${escSvg(model.docType.en || "Document")}</text>` +
    `<text x="40" y="78" font-size="12" fill="#64748b" font-family="Arial, sans-serif">Reconstructed form · page ${pageIdx + 1}</text>`;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${SYNTH_W}" height="${SYNTH_H}" viewBox="0 0 ${SYNTH_W} ${SYNTH_H}">` +
    `<rect width="${SYNTH_W}" height="${SYNTH_H}" fill="#eef2f7"/>` +
    `<rect x="18" y="18" width="${SYNTH_W - 36}" height="${SYNTH_H - 36}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>` +
    header +
    boxes +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
/** One clean synthetic page per page-index that has fields. [] when there are no
 *  fillable fields to draw (caller then shows the upload or a placeholder). */
function syntheticPages(model: DocumentModel): DocPage[] {
  const fields = model.requirements.flatMap((r) => r.fields);
  if (!fields.length) return [];
  const byPage = new Map<number, Field[]>();
  for (const f of fields) {
    const list = byPage.get(f.rect.page);
    if (list) list.push(f);
    else byPage.set(f.rect.page, [f]);
  }
  return [...byPage.keys()]
    .sort((a, b) => a - b)
    .map((idx) => ({ index: idx, image: synthPageSvg(model, byPage.get(idx) ?? [], idx), width: SYNTH_W, height: SYNTH_H }));
}

/** A page the canvas can render for a live upload (the model returns no image).
 *  Prefer a clean reconstructed form drawn from the extracted fields — so a blurry
 *  photo becomes a crisp, aligned page — else the upload itself (nothing to draw)
 *  or a neutral placeholder. */
function buildPages(model: DocumentModel, parsed: ParsedFile, file: string): DocPage[] {
  const synthetic = syntheticPages(model);
  if (synthetic.length) return synthetic;
  if (!parsed.isText && parsed.mimeType.startsWith("image/")) {
    const { width, height } = imageDims(parsed.mimeType, parsed.data);
    return [{ index: 0, image: file, width, height }];
  }
  return [{ index: 0, image: PLACEHOLDER_PAGE, width: 850, height: 1100 }];
}

/**
 * Analyze an uploaded document into a DocumentModel:
 *  1. pull real AcroForm field geometry (PDF only),
 *  2. ask the model (with the real field inventory) for the Requirement spine,
 *  3. normalize (shared trust boundary), stamp real rects, group + order,
 *  4. give the canvas a page to render,
 *  5. fall back to the SBA mock on anything weird so the demo never dies.
 */
export async function analyzeDocument(req: AnalyzeRequest): Promise<DocumentModel> {
  const fileName = req.fileName || MOCK_DOC.fileName;
  const fallback: DocumentModel = { ...MOCK_DOC, fileName };
  const which = provider();
  if (which === "mock") return fallback;

  // (0) identical-doc cache — re-uploads / repeated eval hits return instantly.
  const key = analysisKey(req.file);
  const cached = cacheGet(key);
  if (cached) return { ...cached, fileName };

  const parsed = parseFile(req);

  // (1) real field coordinates for AcroForm PDFs (best-effort; [] otherwise)
  let acro: AcroFieldInfo[] = [];
  if (!parsed.isText && parsed.mimeType === "application/pdf") {
    try {
      acro = await extractAcroFields(parsed.data);
    } catch {
      acro = [];
    }
  }
  const systemText = EXTRACT_SYSTEM + acroInventoryHint(acro);

  try {
    // (2) model call: one retry with backoff under a shared time budget < the
    // route's maxDuration, so a hung call falls through to the mock cleanly.
    const raw = await withRetry(
      () =>
        which === "gemini"
          ? extractWithGemini(parsed, systemText)
          : extractWithAnthropic(parsed, systemText),
      { totalMs: 55_000, label: "extract" },
    );
    let model = normalizeDoc(raw, fileName);
    // A reply with no requirements is useless on stage — protect the demo.
    if (model.requirements.length === 0) return fallback;
    // (3) stamp real geometry, then group + order the live spine
    if (acro.length) model = attachRealRects(model, acro);
    model = { ...model, requirements: groupAndOrder(model.requirements) };
    // (4) the model doesn't render pages; give the canvas one so it never crashes.
    if (model.pages.length === 0) model = { ...model, pages: buildPages(model, parsed, req.file) };
    cacheSet(key, model);
    return model;
  } catch (e) {
    console.error("extract failed, falling back to mock:", e);
    return fallback;
  }
}

/** Queue-named alias for the analyzer entry point. */
export const extractDoc = analyzeDocument;
