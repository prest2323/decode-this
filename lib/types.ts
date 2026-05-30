// ============================================================
//  THE CONTRACT — owned by Preston (Lead, Claude) ONLY.
//  The spine of the whole app: a DocumentModel made of Requirements.
//  Every module reads/writes this shape. Do NOT change without telling
//  the whole team. This is what keeps 4 people from colliding.
// ============================================================

export type Lang = "en" | "es";

/** What kind of thing a Requirement asks of the user. */
export type RequirementType =
  | "fill-field" // one or more inputs ON the page (e.g. a full address block)
  | "gather-document" // bring something external (last year's tax return)
  | "external-action" // do something off-page (pass a background check, get an EIN)
  | "sign" // a signature is required
  | "pay-fee"; // money is due

export type Difficulty = "easy" | "medium" | "hard";
export type ReqStatus = "todo" | "active" | "done";

/** A flag that makes a step scary or important — drives the Protect view. */
export type FlagKind =
  | "deadline"
  | "fee"
  | "background-check"
  | "legal-risk"
  | "scam"
  | "tip";

export interface Flag {
  kind: FlagKind;
  /** Short human label, e.g. "Due Jun 30, 2026" or "$2,500 — non-refundable". */
  label: Record<Lang, string>;
  /** ISO date (YYYY-MM-DD) for deadline flags, else null/absent. */
  date?: string | null;
}

/**
 * A rectangle on a rendered page, in NORMALIZED [0..1] coordinates,
 * origin = top-left of the page. Resolution-independent so overlays line
 * up no matter how large the page is rendered.
 */
export interface Rect {
  page: number; // 0-based page index
  x: number;
  y: number;
  w: number;
  h: number;
}

/** One editable input that lives on the page. Part of a fill-field Requirement. */
export interface Field {
  id: string;
  /** PDF AcroForm field name when known — used on export to write the value back. */
  name: string;
  kind: "text" | "number" | "date" | "checkbox" | "radio" | "signature";
  label: Record<Lang, string>;
  rect: Rect;
  /** Current value the user has entered. */
  value: string | boolean | null;
  required: boolean;
  /** For radio/select groups. */
  options?: string[];
  /** Optional input hint, e.g. "MM/DD/YYYY". */
  placeholder?: string;
}

/**
 * THE ATOMIC UNIT. One thing the user must understand or do.
 * The checklist is a list of these; the guided tour walks the fill-field
 * ones on the document itself; the chat answers questions about any of them.
 */
export interface Requirement {
  id: string;
  /** Tour order. The analyzer sorts by difficulty + page position. */
  order: number;
  type: RequirementType;
  difficulty: Difficulty;
  status: ReqStatus;
  /** Short imperative step text, e.g. "Upload your 2025 tax return". */
  title: Record<Lang, string>;
  /** Plain-language explanation + how to satisfy it (5th-grade reading level). */
  guidance: Record<Lang, string>;
  /** Flags that make this step important (deadlines, fees, checks). */
  flags: Flag[];
  /** The inputs this Requirement covers. Empty unless type === "fill-field". */
  fields: Field[];
  /**
   * The spotlight target on the page — the union (bounding box) of this
   * Requirement's field rects, grouped intelligently (street+city+state+zip
   * become ONE spotlight). null when the Requirement lives off-page.
   */
  spotlight: Rect | null;
}

/** A rendered page of the source document. */
export interface DocPage {
  index: number; // 0-based
  /** Rendered raster as a data URL (or a static URL the canvas can draw). */
  image: string;
  /** Natural pixel size of the rendered raster (for aspect ratio). */
  width: number;
  height: number;
}

/**
 * THE SPINE. One per uploaded document. Every module reads/writes this.
 * Created by the analyzer (lib/extract), held in client state (lib/store),
 * rendered by the canvas + checklist, queried by chat, written out by export.
 */
export interface DocumentModel {
  id: string;
  fileName: string;
  /** Document class, e.g. "SBA Form 1919 — Borrower Information". */
  docType: Record<Lang, string>;
  /** 3-sentence plain-language summary of the whole document. */
  summary: Record<Lang, string>;
  pages: DocPage[];
  requirements: Requirement[];
  /** Top-level risk flags for the Protect view (deadlines, fees, checks). */
  topFlags: Flag[];
  /** The original uploaded file as a base64 data URL (PDF), when there is one.
   *  Lets export fill the REAL AcroForm instead of generating a fresh PDF. */
  sourceFile?: string;
}

// ---------- API ----------

/** POST /api/analyze — a document in, a DocumentModel out. */
export interface AnalyzeRequest {
  fileName: string;
  /** base64 data URL of the file (PDF or image), or raw extracted text. */
  file: string;
  mime?: string;
}

/** POST /api/chat — a question grounded in the current document. */
export interface ChatRequest {
  question: string;
  lang: Lang;
  /** The current document model — grounds the answer. */
  doc: DocumentModel;
  /** The Requirement the user is on, if any — sharpens the answer. */
  activeRequirementId?: string | null;
}

export interface ChatResult {
  answer: string;
  /** Requirement ids the answer relates to, for optional highlighting. */
  citedRequirementIds?: string[];
}

export type ExportFormat = "pdf" | "json" | "csv" | "docx";
export interface ExportRequest {
  doc: DocumentModel;
  format: ExportFormat;
}

/** Discriminated API envelope. */
export type ApiResponse<T> =
  | { ok: true; result: T }
  | { ok: false; error: string };
