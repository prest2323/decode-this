// PROVIDER CLIENT + CRASH-PROOF NORMALIZER — owned by Preston (Lead).
// Auto-selects the AI backend by which key is set (Gemini free = default,
// Anthropic = fallback, no key = mock so the whole app runs offline/on stage).
// Michael's lib/extract.ts + lib/chat.ts use these clients for the REAL calls,
// then pass the raw model JSON through normalizeDoc()/normalizeChat() here so an
// off-spec reply can NEVER crash the UI or break the contract.
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import type {
  ChatResult,
  Difficulty,
  DocPage,
  DocumentModel,
  Field,
  Flag,
  FlagKind,
  Lang,
  Rect,
  Requirement,
  RequirementType,
  ReqStatus,
} from "@/lib/types";

export type Provider = "gemini" | "anthropic" | "mock";

export function provider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function geminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
}

export function anthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });
}

// ============================================================
//  CRASH-PROOF NORMALIZATION (the contract's safety net)
//  Coerce ANY object into a valid DocumentModel/ChatResult:
//  - every Record<Lang,string> -> { en, es } strings
//  - every Rect clamped to [0..1]
//  - unknown enums defaulted to safe values
//  - a requirement's spotlight recomputed as the bounding box of its
//    fields when the model omits it (the "intelligently grouped" rule)
// ============================================================

const REQ_TYPES: RequirementType[] = ["fill-field", "gather-document", "external-action", "sign", "pay-fee"];
const DIFFS: Difficulty[] = ["easy", "medium", "hard"];
const STATUSES: ReqStatus[] = ["todo", "active", "done"];
const FLAG_KINDS: FlagKind[] = ["deadline", "fee", "background-check", "legal-risk", "scam", "tip"];
const FIELD_KINDS: Field["kind"][] = ["text", "number", "date", "checkbox", "radio", "signature"];

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
function oneOf<T extends string>(v: unknown, allowed: T[], fallback: T): T {
  return allowed.includes(v as T) ? (v as T) : fallback;
}
function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}
function bi(v: unknown): Record<Lang, string> {
  if (v && typeof v === "object") {
    const o = v as { en?: unknown; es?: unknown };
    const en = str(o.en);
    const es = str(o.es);
    if (en || es) return { en: en || es, es: es || en };
  }
  if (typeof v === "string") return { en: v, es: v };
  return { en: "", es: "" };
}
function rect(v: unknown, page = 0): Rect | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  return {
    page: Math.max(0, Math.floor(num(o.page, page))),
    x: clamp01(num(o.x)),
    y: clamp01(num(o.y)),
    w: clamp01(num(o.w)),
    h: clamp01(num(o.h)),
  };
}
function bboxOf(fields: Field[]): Rect | null {
  if (fields.length === 0) return null;
  const page = fields[0].rect.page;
  const same = fields.filter((f) => f.rect.page === page);
  const minX = Math.min(...same.map((f) => f.rect.x));
  const minY = Math.min(...same.map((f) => f.rect.y));
  const maxX = Math.max(...same.map((f) => f.rect.x + f.rect.w));
  const maxY = Math.max(...same.map((f) => f.rect.y + f.rect.h));
  const pad = 0.012;
  return {
    page,
    x: clamp01(minX - pad),
    y: clamp01(minY - pad),
    w: clamp01(maxX - minX + pad * 2),
    h: clamp01(maxY - minY + pad * 2),
  };
}
function normField(v: unknown, i: number): Field {
  const o = obj(v);
  return {
    id: str(o.id, `f_${i}`),
    name: str(o.name, `field_${i}`),
    kind: oneOf(o.kind, FIELD_KINDS, "text"),
    label: bi(o.label),
    rect: rect(o.rect) ?? { page: 0, x: 0, y: 0, w: 0, h: 0 },
    value: typeof o.value === "string" || typeof o.value === "boolean" ? o.value : null,
    required: o.required === true,
    options: Array.isArray(o.options) ? (o.options.filter((x) => typeof x === "string") as string[]) : undefined,
    placeholder: typeof o.placeholder === "string" ? o.placeholder : undefined,
  };
}
function normFlag(v: unknown): Flag {
  const o = obj(v);
  return {
    kind: oneOf(o.kind, FLAG_KINDS, "tip"),
    label: bi(o.label),
    date: typeof o.date === "string" ? o.date : null,
  };
}
function normRequirement(v: unknown, i: number): Requirement {
  const o = obj(v);
  const fields = Array.isArray(o.fields) ? o.fields.map(normField) : [];
  return {
    id: str(o.id, `r_${i}`),
    order: Math.floor(num(o.order, i + 1)),
    type: oneOf(o.type, REQ_TYPES, "fill-field"),
    difficulty: oneOf(o.difficulty, DIFFS, "medium"),
    status: oneOf(o.status, STATUSES, "todo"),
    title: bi(o.title),
    guidance: bi(o.guidance),
    flags: Array.isArray(o.flags) ? o.flags.map(normFlag) : [],
    fields,
    // grouped-spotlight rule: use the model's spotlight, else the bbox of fields
    spotlight: rect(o.spotlight) ?? bboxOf(fields),
  };
}
function normPage(v: unknown, i: number): DocPage {
  const o = obj(v);
  return {
    index: Math.floor(num(o.index, i)),
    image: str(o.image),
    width: Math.max(1, num(o.width, 850)),
    height: Math.max(1, num(o.height, 1100)),
  };
}

/** Coerce any raw object (e.g. a model reply) into a valid DocumentModel. */
export function normalizeDoc(raw: unknown, fileName = "document"): DocumentModel {
  const o = obj(raw);
  const requirements = (Array.isArray(o.requirements) ? o.requirements.map(normRequirement) : []).sort(
    (a, b) => a.order - b.order,
  );
  // ensure exactly one active step so the tour always has a focus
  if (requirements.length && !requirements.some((r) => r.status === "active")) {
    requirements[0] = { ...requirements[0], status: "active" };
  }
  return {
    id: str(o.id, "doc"),
    fileName: str(o.fileName, fileName),
    docType: bi(o.docType),
    summary: bi(o.summary),
    pages: Array.isArray(o.pages) ? o.pages.map(normPage) : [],
    requirements,
    topFlags: Array.isArray(o.topFlags) ? o.topFlags.map(normFlag) : [],
  };
}

/** Coerce any raw object (or string) into a valid ChatResult. */
export function normalizeChat(raw: unknown): ChatResult {
  if (typeof raw === "string") return { answer: raw };
  const o = obj(raw);
  return {
    answer: str(o.answer),
    citedRequirementIds: Array.isArray(o.citedRequirementIds)
      ? (o.citedRequirementIds.filter((x) => typeof x === "string") as string[])
      : undefined,
  };
}
