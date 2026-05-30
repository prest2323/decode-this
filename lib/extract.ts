// EXTRACT — owned by Michael (backend, heavy track). Turns an uploaded document
// into a DocumentModel. The template returns the SBA mock so the whole app runs
// and demos with no API key. Michael replaces the TODO with real multimodal
// extraction (see lib/prompt.ts) — but ALWAYS keeps the mock fallback so the demo
// can never hang on the network.
//
// normalizeDoc() is the trust boundary: EVERY model reply (and the mock) passes
// through it, so an off-spec response can never crash the UI. It coerces every
// field to the contract in lib/types.ts, clamps rects to [0..1], repairs unknown
// enums, dedupes ids, and re-derives each fill-field spotlight from its fields.
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
import { provider } from "@/lib/ai";

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

/**
 * The trust boundary. Turn ANY value (a model reply, partial JSON, or the mock)
 * into a valid DocumentModel that the rest of the app can render without guards.
 * Never throws.
 */
export function normalizeDoc(raw: unknown): DocumentModel {
  const o = asObj(raw);
  const seenReq = new Set<string>();
  const seenField = new Set<string>();
  return {
    id: str(o.id) || "doc",
    fileName: str(o.fileName) || "document",
    docType: bilingual(o.docType),
    summary: bilingual(o.summary),
    pages: asArr(o.pages).map(docPage),
    requirements: asArr(o.requirements).map((r, i) => requirement(r, i, seenReq, seenField)),
    topFlags: asArr(o.topFlags).map(flag),
  };
}

export async function analyzeDocument(req: AnalyzeRequest): Promise<DocumentModel> {
  const fileName = req.fileName || MOCK_DOC.fileName;
  // Mock and live BOTH pass through normalizeDoc — one trust boundary.
  const fallback = normalizeDoc({ ...MOCK_DOC, fileName });

  if (provider() === "mock") return fallback;

  try {
    // TODO (task 4): real multimodal extraction with EXTRACT_SYSTEM + extractSchema,
    // then `return normalizeDoc(raw)`. Until that lands, even WITH a key we return
    // the normalized mock so the demo is guaranteed.
    return fallback;
  } catch {
    return fallback;
  }
}
