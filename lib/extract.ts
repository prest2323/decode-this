// EXTRACT — owned by Michael (backend, heavy track). Turns an uploaded document
// into a DocumentModel. Gemini (default) / Anthropic (fallback) read the file
// multimodally and return JSON; normalizeDoc() is the trust boundary every reply
// passes through. With no key — or on ANY failure — we return the SBA mock, so
// the demo can never hang on the network.
//
// NOTE on pages: the model returns docType/summary/topFlags/requirements, NOT the
// rendered page images. Rects are normalized [0..1] precisely so the canvas can
// overlay them on whatever it renders from the original upload. Populating
// DocumentModel.pages for a live PDF (pdfjs render) is the canvas/integration
// seam (Sawyer/Preston) — flagged, not reached into. The mock ships real pages.
import type {
  AnalyzeRequest,
  DocumentModel,
  Requirement,
  Field,
  Rect,
  Flag,
  DocPage,
  Lang,
  RequirementType,
  Difficulty,
  ReqStatus,
  FlagKind,
} from "@/lib/types";
import { MOCK_DOC } from "@/lib/mock";
import type { Schema } from "@google/genai";
import { provider, geminiClient, anthropicClient, GEMINI_MODEL, ANTHROPIC_MODEL } from "@/lib/ai";
import { EXTRACT_SYSTEM, extractSchema } from "@/lib/prompt";

// ---------- coercion primitives ----------
type Dict = Record<string, unknown>;

const asObj = (v: unknown): Dict =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Dict) : {};
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string"
    ? v
    : typeof v === "number" || typeof v === "boolean"
      ? String(v)
      : fallback;

const clamp01 = (v: unknown): number => {
  const n = typeof v === "number" && Number.isFinite(v) ? v : 0;
  return Math.min(1, Math.max(0, n));
};

const int = (v: unknown, fallback = 0): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
};

const oneOf = <T extends string>(
  v: unknown,
  allowed: readonly T[],
  fallback: T,
): T => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);

/** Coerce to a complete {en,es}; fill es from en (or en from es) when one is missing. */
function bilingual(v: unknown): Record<Lang, string> {
  if (typeof v === "string") return { en: v, es: v };
  const o = asObj(v);
  const en = typeof o.en === "string" ? o.en : typeof o.es === "string" ? o.es : "";
  const es = typeof o.es === "string" ? o.es : en;
  return { en, es: es || en };
}

// ---------- contract unions ----------
const FIELD_KINDS = ["text", "number", "date", "checkbox", "radio", "signature"] as const;
const REQ_TYPES: readonly RequirementType[] = ["fill-field", "gather-document", "external-action", "sign", "pay-fee"];
const DIFFS: readonly Difficulty[] = ["easy", "medium", "hard"];
const STATUSES: readonly ReqStatus[] = ["todo", "active", "done"];
const FLAG_KINDS: readonly FlagKind[] = ["deadline", "fee", "background-check", "legal-risk", "scam", "tip"];

function rect(v: unknown): Rect {
  const o = asObj(v);
  return { page: Math.max(0, int(o.page, 0)), x: clamp01(o.x), y: clamp01(o.y), w: clamp01(o.w), h: clamp01(o.h) };
}

function flag(v: unknown): Flag {
  const o = asObj(v);
  const f: Flag = { kind: oneOf(o.kind, FLAG_KINDS, "tip"), label: bilingual(o.label) };
  if (typeof o.date === "string") f.date = o.date;
  else if (o.date === null) f.date = null;
  return f;
}

function fieldValue(v: unknown): string | boolean | null {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return null;
}

function field(v: unknown, idx: number, seen: Set<string>): Field {
  const o = asObj(v);
  let id = str(o.id) || `fld_${idx}`;
  while (seen.has(id)) id = `${id}_${idx}`;
  seen.add(id);
  const f: Field = {
    id,
    name: str(o.name) || id,
    kind: oneOf(o.kind, FIELD_KINDS, "text"),
    label: bilingual(o.label),
    rect: rect(o.rect),
    value: fieldValue(o.value),
    required: o.required === true,
  };
  if (Array.isArray(o.options)) f.options = o.options.map((x) => str(x)).filter(Boolean);
  if (typeof o.placeholder === "string") f.placeholder = o.placeholder;
  return f;
}

// Padded bounding box of a group of fields = the grouped spotlight. Same padding
// as lib/mock.ts so routing the mock through normalizeDoc reproduces it exactly.
const SPOTLIGHT_PAD = 0.012;
function bboxOf(fields: Field[]): Rect | null {
  if (!fields.length) return null;
  const page = fields[0].rect.page;
  const same = fields.filter((f) => f.rect.page === page);
  const minX = Math.min(...same.map((f) => f.rect.x));
  const minY = Math.min(...same.map((f) => f.rect.y));
  const maxX = Math.max(...same.map((f) => f.rect.x + f.rect.w));
  const maxY = Math.max(...same.map((f) => f.rect.y + f.rect.h));
  return {
    page,
    x: Math.max(0, minX - SPOTLIGHT_PAD),
    y: Math.max(0, minY - SPOTLIGHT_PAD),
    w: Math.min(1, maxX - minX + SPOTLIGHT_PAD * 2),
    h: Math.min(1, maxY - minY + SPOTLIGHT_PAD * 2),
  };
}

function requirement(
  v: unknown,
  idx: number,
  seenReq: Set<string>,
  seenField: Set<string>,
): Requirement {
  const o = asObj(v);
  let id = str(o.id) || `r_${idx}`;
  while (seenReq.has(id)) id = `${id}_${idx}`;
  seenReq.add(id);

  const fields = asArr(o.fields).map((fv, i) => field(fv, idx * 100 + i, seenField));
  // Repair an unknown/missing type by inference: fields present → on-page fill.
  const inferredType: RequirementType = fields.length > 0 ? "fill-field" : "gather-document";
  const type = oneOf(o.type, REQ_TYPES, inferredType);
  // Re-derive the spotlight so grouping is always consistent: fill-field steps
  // spotlight the bbox of their fields; everything else lives off-page (null).
  const spotlight = type === "fill-field" ? bboxOf(fields) : null;

  return {
    id,
    order: int(o.order, idx),
    type,
    difficulty: oneOf(o.difficulty, DIFFS, "medium"),
    status: oneOf(o.status, STATUSES, "todo"),
    title: bilingual(o.title),
    guidance: bilingual(o.guidance),
    flags: asArr(o.flags).map(flag),
    fields,
    spotlight,
  };
}

function docPage(v: unknown, idx: number): DocPage {
  const o = asObj(v);
  return {
    index: int(o.index, idx),
    image: str(o.image),
    width: int(o.width, 850) || 850,
    height: int(o.height, 1100) || 1100,
  };
}

// ---------- grouping + difficulty + ordering (runs inside normalizeDoc) ----------
const DIFF_RANK: Record<Difficulty, number> = { easy: 0, medium: 1, hard: 2 };
const RANK_DIFF: Difficulty[] = ["easy", "medium", "hard"];
const maxDiff = (...ds: Difficulty[]): Difficulty => RANK_DIFF[Math.max(...ds.map((d) => DIFF_RANK[d]))];

/** Which logical unit a field belongs to, for safety-net grouping. */
function unitOf(f: Field): "address" | "name" | null {
  const s = `${f.name} ${f.label.en} ${f.label.es}`.toLowerCase();
  if (/street|address|addr|\bcity\b|\bstate\b|\bzip\b|postal|\bapt\b|suite|calle|ciudad|estado|direcci/.test(s)) return "address";
  if (/first.?name|last.?name|middle.?name|full.?name|apellido|nombre/.test(s)) return "name";
  return null;
}

/** A fill-field requirement's unit, only when ALL its classified fields agree. */
function reqUnit(r: Requirement): "address" | "name" | null {
  if (r.type !== "fill-field" || !r.fields.length) return null;
  const set = new Set(r.fields.map(unitOf).filter(Boolean) as ("address" | "name")[]);
  return set.size === 1 ? [...set][0] : null;
}

/** Difficulty = the hardest of: model-provided, the type baseline, and flag severity. */
function scoreDifficulty(r: Requirement): Difficulty {
  const typeBase: Difficulty = r.type === "fill-field" ? "easy" : "medium";
  const hasHeavy = r.flags.some((f) => f.kind === "legal-risk" || f.kind === "background-check");
  const hasMed = r.flags.some((f) => f.kind === "fee" || f.kind === "deadline");
  const flagBase: Difficulty = hasHeavy ? "hard" : hasMed ? "medium" : "easy";
  return maxDiff(r.difficulty, typeBase, flagBase);
}

/** Tour phase: prerequisites (0) → on-page fills (1) → commit/pay (2). */
function phaseOf(t: RequirementType): number {
  if (t === "gather-document" || t === "external-action") return 0;
  if (t === "fill-field") return 1;
  return 2; // sign, pay-fee
}

/**
 * (a) Merge consecutive same-unit fill-field requirements (an address or name
 *     split across separate requirements) into ONE, with ONE re-derived spotlight
 *     — a safety net for when the model fails to group. (b) Re-score difficulty.
 *     (c) Order the tour: prerequisites first, then fills easy→hard / top→bottom,
 *     then pay-fee, with sign always last. Reassign `order` to the final index.
 */
export function groupAndOrder(reqs: Requirement[]): Requirement[] {
  // (a) merge
  const merged: Requirement[] = [];
  for (const r of reqs) {
    const prev = merged[merged.length - 1];
    const u = reqUnit(r);
    if (
      prev &&
      u &&
      reqUnit(prev) === u &&
      prev.fields.length > 0 &&
      r.fields.length > 0 &&
      prev.fields[0].rect.page === r.fields[0].rect.page
    ) {
      const fields = [...prev.fields, ...r.fields];
      merged[merged.length - 1] = { ...prev, fields, spotlight: bboxOf(fields), flags: [...prev.flags, ...r.flags] };
    } else {
      merged.push(r);
    }
  }

  // (b) difficulty
  const scored = merged.map((r) => ({ ...r, difficulty: scoreDifficulty(r) }));

  // (c) order
  const posOf = (r: Requirement): number => {
    const rc = r.spotlight ?? r.fields[0]?.rect ?? null;
    return rc ? rc.page * 10 + rc.y : 0;
  };
  const ordered = [...scored].sort((a, b) => {
    const pa = phaseOf(a.type);
    const pb = phaseOf(b.type);
    if (pa !== pb) return pa - pb;
    // sign always last within its phase
    const sa = a.type === "sign" ? 1 : 0;
    const sb = b.type === "sign" ? 1 : 0;
    if (sa !== sb) return sa - sb;
    const da = DIFF_RANK[a.difficulty];
    const db = DIFF_RANK[b.difficulty];
    if (da !== db) return da - db;
    const ya = posOf(a);
    const yb = posOf(b);
    if (ya !== yb) return ya - yb;
    return a.order - b.order; // stable final tie-break
  });

  return ordered.map((r, i) => ({ ...r, order: i + 1 }));
}

/**
 * The trust boundary. Turn ANY value (a model reply, partial JSON, or the mock)
 * into a valid DocumentModel that the rest of the app can render without guards.
 * Never throws.
 */
export function normalizeDoc(raw: unknown): DocumentModel {
  const o = asObj(raw);
  const seenReq = new Set<string>();
  const seenField = new Set<string>();
  const requirements = asArr(o.requirements).map((r, i) => requirement(r, i, seenReq, seenField));
  return {
    id: str(o.id) || "doc",
    fileName: str(o.fileName) || "document",
    docType: bilingual(o.docType),
    summary: bilingual(o.summary),
    pages: asArr(o.pages).map(docPage),
    requirements: groupAndOrder(requirements),
    topFlags: asArr(o.topFlags).map(flag),
  };
}

// ---------- live extraction ----------

/** Split a base64 data URL into {mimeType, data}; tolerate raw base64 / raw text. */
function parseFile(req: AnalyzeRequest): { mimeType: string; data: string; isText: boolean } {
  const m = req.file.match(/^data:(.+?);base64,([\s\S]*)$/);
  if (m) return { mimeType: m[1], data: m[2], isText: false };
  if (req.mime && !req.mime.startsWith("text")) {
    return { mimeType: req.mime, data: req.file.replace(/^data:.*?,/, ""), isText: false };
  }
  return { mimeType: req.mime || "text/plain", data: req.file, isText: true };
}

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

async function extractWithGemini(req: AnalyzeRequest): Promise<unknown> {
  const { mimeType, data, isText } = parseFile(req);
  const parts = isText
    ? [{ text: EXTRACT_SYSTEM }, { text: data }]
    : [{ text: EXTRACT_SYSTEM }, { inlineData: { mimeType, data } }];
  const res = await geminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      // extractSchema is hand-built with the Type enum; cast to the SDK's Schema.
      responseSchema: extractSchema as unknown as Schema,
    },
  });
  return JSON.parse(res.text ?? "{}");
}

async function extractWithAnthropic(req: AnalyzeRequest): Promise<unknown> {
  const { mimeType, data, isText } = parseFile(req);
  const client = anthropicClient();
  const fileBlock = isText
    ? { type: "text" as const, text: `Document text:\n"""${data}"""` }
    : mimeType === "application/pdf"
      ? { type: "document" as const, source: { type: "base64" as const, media_type: "application/pdf" as const, data } }
      : { type: "image" as const, source: { type: "base64" as const, media_type: mimeType as "image/jpeg" | "image/png", data } };
  const msg = await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 8192,
    tools: [
      {
        name: "emit_document_model",
        description: "Return the structured DocumentModel for the document.",
        input_schema: toJsonSchema(extractSchema) as { type: "object" },
      },
    ],
    tool_choice: { type: "tool", name: "emit_document_model" },
    // Anthropic content blocks; cast because we mix document/image/text shapes.
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: EXTRACT_SYSTEM }] as never }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  return block && block.type === "tool_use" ? block.input : {};
}

/**
 * Analyze an uploaded document into a DocumentModel. Route by provider, run the
 * raw reply through normalizeDoc, and fall back to the SBA mock on anything weird
 * (no key, network error, off-spec reply, or a reply with zero requirements).
 */
export async function analyzeDocument(req: AnalyzeRequest): Promise<DocumentModel> {
  const fileName = req.fileName || MOCK_DOC.fileName;
  const fallback = normalizeDoc({ ...MOCK_DOC, fileName });
  const which = provider();
  if (which === "mock") return fallback;

  try {
    const raw = which === "gemini" ? await extractWithGemini(req) : await extractWithAnthropic(req);
    const model = normalizeDoc({ ...asObj(raw), fileName });
    // A reply with no requirements is useless on stage — protect the demo.
    return model.requirements.length > 0 ? model : fallback;
  } catch (e) {
    console.error("extract failed, falling back to mock:", e);
    return fallback;
  }
}

/** Queue-named alias for the analyzer entry point. */
export const extractDoc = analyzeDocument;
