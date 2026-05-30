// Gemini provider — owned by Lead. Free-tier backend (Google AI Studio key).
// Used when GEMINI_API_KEY is set and there's no ANTHROPIC_API_KEY.
// Forces JSON output that matches the contract in lib/types.ts.
import { GoogleGenAI } from "@google/genai";
import type { DecodeResult, ExpressResult, Lang } from "@/lib/types";
import { DECODE_SYSTEM, EXPRESS_SYSTEM } from "@/lib/prompt";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DECODE_JSON = `Return ONLY a JSON object, no markdown, exactly this shape:
{"title":{"en":string,"es":string},"meaning":{"en":string,"es":string},
"action":{"en":string,"es":string},"deadline":string|null (ISO YYYY-MM-DD),
"urgency":"urgent"|"normal"|"ignore"|"scam","draftReply":string|null}`;

const EXPRESS_JSON = `Return ONLY a JSON object, no markdown, exactly this shape:
{"kind":string,"formatted":string,"note":string}`;

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
        parts: [
          { inlineData: { mimeType, data } },
          { text: "Decode this document for me." },
        ],
      },
    ],
    config: {
      systemInstruction: `${DECODE_SYSTEM}\n\n${DECODE_JSON}`,
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });
  return parseJson<DecodeResult>(res.text);
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
      temperature: 0.4,
    },
  });
  return parseJson<ExpressResult>(res.text);
}

function parseJson<T>(raw: string | undefined): T {
  if (!raw) throw new Error("Empty Gemini response");
  // Strip accidental ```json fences just in case.
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

function splitDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) throw new Error("Image must be a base64 data URL");
  return { mimeType: m[1], data: m[2] };
}
