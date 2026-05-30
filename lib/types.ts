// ============================================================
//  THE CONTRACT — owned by Lead (Claude 5x #1) ONLY.
//  Do NOT change these types without telling the whole team.
//  Everyone builds against these shapes. This is what keeps
//  4 people from colliding. Frozen at kickoff.
// ============================================================

export type Lang = "en" | "es";

/** Triage flag shown on a decoded document. */
export type Urgency = "urgent" | "normal" | "ignore" | "scam";

/** Which direction are we decoding? */
export type Mode = "decode" | "express";

// ---- DECODE: the world -> you (a confusing document made plain) ----
export interface DecodeResult {
  /** What this document IS, one short sentence. */
  title: Record<Lang, string>;
  /** What it means for YOU, plain language. */
  meaning: Record<Lang, string>;
  /** What to do about it. */
  action: Record<Lang, string>;
  /** ISO date like "2026-06-12", or null if no deadline. */
  deadline: string | null;
  /** Triage flag. */
  urgency: Urgency;
  /** Optional drafted reply, bilingual (en+es). null if not applicable. */
  draftReply: Record<Lang, string> | null;
}

// ---- EXPRESS: you -> the world (your tangled thought made into words) ----
export interface ExpressResult {
  /** e.g. "Email to teacher", "Formal letter", "Form answer". */
  kind: string;
  /** The polished text the user can copy/send. */
  formatted: string;
  /** One friendly line about what was produced. */
  note: string;
}

// ---- API request/response shapes ----
export interface DecodeRequest {
  mode: "decode";
  /** base64 data URL, e.g. "data:image/jpeg;base64,..." */
  image: string;
}
export interface ExpressRequest {
  mode: "express";
  /** The user's raw, messy thought. */
  text: string;
  /** Output language. */
  lang: Lang;
  /** Optional: who it's for, e.g. "my child's teacher". */
  audience?: string;
}
export type ApiRequest = DecodeRequest | ExpressRequest;

export type ApiResponse =
  | { ok: true; mode: "decode"; result: DecodeResult }
  | { ok: true; mode: "express"; result: ExpressResult }
  | { ok: false; error: string };
