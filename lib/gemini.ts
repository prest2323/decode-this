// Gemini provider — owned by Lead. Free-tier backend (Google AI Studio key).
// Used when GEMINI_API_KEY is set and there's no ANTHROPIC_API_KEY.
// Forces JSON output that matches the contract in lib/types.ts, then NORMALIZES
// the result so an off-spec model response can never crash the UI.
import { GoogleGenAI, Type } from "@google/genai";
import type { DecodeResult, ExpressResult, Lang } from "@/lib/types";
import { DECODE_SYSTEM, EXPRESS_SYSTEM } from "@/lib/prompt";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const bilingualSchema = {
  type: Type.OBJECT,
  properties: { en: { type: Type.STRING }, es: { type: Type.STRING } },
  required: ["en", "es"],
};

const DECODE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: bilingualSchema,
    meaning: bilingualSchema,
    action: bilingualSchema,
    deadline: { type: Type.STRING, nullable: true },
    urgency: { type: Type.STRING, enum: ["urgent", "normal", "ignore", "scam"] },
    draftReply: { ...bilingualSchema, nullable: true },
  },
  required: ["title", "meaning", "action", "deadline", "urgency", "draftReply"],
};

const EXPRESS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    kind: { type: Type.STRING },
    formatted: { type: Type.STRING },
    note: { type: Type.STRING },
  },
  required: ["kind", "formatted", "note"],
};

const DECODE_JSON = `Return a JSON object with: title/meaning/action each as {en, es}; deadline (ISO YYYY-MM-DD or null); urgency one of urgent|normal|ignore|scam; draftReply as {en, es} or null.`;
const EXPRESS_JSON = `Return a JSON object: {kind, formatted, note}. "formatted" must be in the requested language.`;

function client() {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
}

export async function decodeWithGemini(dataUrl: string): Promise<DecodeResult> {
  const { mimeType, data } = splitDataUrl(dataUrl);
  const res = await client().models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ inlineData: { mimeType, data } }, { text: "Decode this document for me." }],
      },
    ],
    config: {
      systemInstruction: `${DECODE_SYSTEM}\n\n${DECODE_JSON}`,
      responseMimeType: "application/json",
      responseSchema: DECODE_SCHEMA,
      temperature: 0.2,
    },
  });
  return normalizeDecode(parseJson(res.text));
}

export async function expressWithGemini(
  text: string,
  lang: Lang,
  audience?: string,
): Promise<ExpressResult> {
  const langName = lang === "es" ? "Spanish" : "English";
  const aud = audience ? ` The audience is: ${audience}.` : "";
  const res = await client().models.generateContent({
    model: GEMINI_MODEL,
    contents: `Output language: ${langName}.${aud}\n\nHere is what I'm trying to say:\n"""${text}"""`,
    config: {
      systemInstruction: `${EXPRESS_SYSTEM}\n\n${EXPRESS_JSON}`,
      responseMimeType: "application/json",
      responseSchema: EXPRESS_SCHEMA,
      temperature: 0.4,
    },
  });
  return normalizeExpress(parseJson(res.text));
}

// ---- parsing + normalization (the safety net that prevents UI crashes) ----

function parseJson(raw: string | undefined): Record<string, unknown> {
  if (!raw) throw new Error("Empty model response");
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const slice = start >= 0 && end >= start ? raw.slice(start, end + 1) : raw;
  return JSON.parse(slice) as Record<string, unknown>;
}

function bi(v: unknown): Record<Lang, string> {
  if (v && typeof v === "object") {
    const o = v as { en?: unknown; es?: unknown };
    const en = typeof o.en === "string" ? o.en : "";
    const es = typeof o.es === "string" ? o.es : "";
    if (en || es) return { en: en || es, es: es || en };
  }
  if (typeof v === "string") return { en: v, es: v };
  return { en: "", es: "" };
}

function normalizeDecode(o: Record<string, unknown>): DecodeResult {
  const urgRaw = String(o.urgency ?? "").toLowerCase();
  const urgency = (["urgent", "normal", "ignore", "scam"].includes(urgRaw)
    ? urgRaw
    : "normal") as DecodeResult["urgency"];
  return {
    title: bi(o.title),
    meaning: bi(o.meaning),
    action: bi(o.action),
    deadline: typeof o.deadline === "string" ? o.deadline : null,
    urgency,
    draftReply: o.draftReply ? bi(o.draftReply) : null,
  };
}

function normalizeExpress(o: Record<string, unknown>): ExpressResult {
  return {
    kind: typeof o.kind === "string" ? o.kind : "Message",
    formatted: typeof o.formatted === "string" ? o.formatted : "",
    note: typeof o.note === "string" ? o.note : "",
  };
}

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) throw new Error("Image must be a base64 data URL");
  return { mimeType: m[1], data: m[2] };
}
