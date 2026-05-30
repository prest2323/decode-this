// /api/decode — owned by Lead (Claude 5x #1).
// Handles BOTH directions: mode "decode" (image -> plain language)
// and mode "express" (messy thought -> polished words).
// Provider auto-select: ANTHROPIC_API_KEY -> Claude, else GEMINI_API_KEY -> Gemini, else mock.
// A `?demo=1` query param always returns baked mock data for a network-proof live demo.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ApiRequest, ApiResponse, DecodeResult, ExpressResult } from "@/lib/types";
import { MOCK_DECODE, MOCK_EXPRESS } from "@/lib/mock";
import { DECODE_SYSTEM, EXPRESS_SYSTEM, DECODE_TOOL, EXPRESS_TOOL } from "@/lib/prompt";
import { decodeWithGemini, expressWithGemini, followupWithGemini } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.MODEL || "claude-sonnet-4-6";

// Provider is chosen by which key is present:
//   ANTHROPIC_API_KEY -> Claude   |   GEMINI_API_KEY -> Gemini (free)   |   neither -> mock
function provider(): "anthropic" | "gemini" | "mock" {
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "mock";
}

// Mock answer for the voice follow-up Q&A when there's no key (and for ?demo=1).
const MOCK_FOLLOWUP: Record<"en" | "es", string> = {
  en: "If you can't pay or renew in time, call the office at the number on your letter and ask for help or more time — they often have options, and you won't lose your coverage just for asking. A local community organization can also help you for free.",
  es: "Si no puede pagar o renovar a tiempo, llame a la oficina al número de su carta y pida ayuda o más tiempo — muchas veces tienen opciones, y no perderá su cobertura solo por preguntar. Una organización comunitaria local también puede ayudarle gratis.",
};

export async function POST(req: NextRequest) {
  let body: ApiRequest;
  try {
    body = (await req.json()) as ApiRequest;
  } catch {
    return json({ ok: false, error: "Invalid JSON." });
  }

  // Validate input with clear, human messages before doing any work.
  if (body.mode === "decode" && (typeof body.image !== "string" || !body.image.startsWith("data:"))) {
    return json({ ok: false, error: "No image yet — take a photo of the document first." });
  }
  if (body.mode === "express" && (typeof body.text !== "string" || !body.text.trim())) {
    return json({ ok: false, error: "Nothing to put into words yet — say or type something first." });
  }
  if (body.mode === "followup" && (typeof body.question !== "string" || !body.question.trim())) {
    return json({ ok: false, error: "Ask a question first." });
  }

  // Deterministic demo path: /api/decode?demo=1 always returns baked mock data,
  // so the on-stage hero moment never depends on conference wifi.
  if (req.nextUrl.searchParams.get("demo")) {
    if (body.mode === "express") return json({ ok: true, mode: "express", result: MOCK_EXPRESS });
    if (body.mode === "followup") return json({ ok: true, mode: "followup", result: { answer: MOCK_FOLLOWUP[body.lang] } });
    return json({ ok: true, mode: "decode", result: MOCK_DECODE });
  }

  const which = provider();

  // No key anywhere? Return mock so teammates can build the UI without secrets.
  if (which === "mock") {
    if (body.mode === "express") return json({ ok: true, mode: "express", result: MOCK_EXPRESS });
    if (body.mode === "followup") return json({ ok: true, mode: "followup", result: { answer: MOCK_FOLLOWUP[body.lang] } });
    return json({ ok: true, mode: "decode", result: MOCK_DECODE });
  }

  try {
    if (body.mode === "decode") {
      const result =
        which === "gemini"
          ? await decodeWithGemini(body.image)
          : await runDecode(anthropic(), body.image);
      return json({ ok: true, mode: "decode", result });
    }
    if (body.mode === "express") {
      const result =
        which === "gemini"
          ? await expressWithGemini(body.text, body.lang, body.audience)
          : await runExpress(anthropic(), body.text, body.lang, body.audience);
      return json({ ok: true, mode: "express", result });
    }
    if (body.mode === "followup") {
      const result =
        which === "gemini"
          ? await followupWithGemini(body.question, body.lang, body.context)
          : { answer: MOCK_FOLLOWUP[body.lang] };
      return json({ ok: true, mode: "followup", result });
    }
    return json({ ok: false, error: "Unknown mode." });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "Decode failed. Try again." });
  }
}

function anthropic(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });
}

async function runDecode(client: Anthropic, dataUrl: string): Promise<DecodeResult> {
  const { mediaType, data } = splitDataUrl(dataUrl);
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: DECODE_SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [DECODE_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: DECODE_TOOL.name },
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: mediaType as "image/jpeg", data } },
          { type: "text", text: "Decode this document for me." },
        ],
      },
    ],
  });
  return firstToolInput<DecodeResult>(msg);
}

async function runExpress(
  client: Anthropic,
  text: string,
  lang: "en" | "es",
  audience?: string,
): Promise<ExpressResult> {
  const langName = lang === "es" ? "Spanish" : "English";
  const aud = audience ? ` The audience is: ${audience}.` : "";
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: EXPRESS_SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: [EXPRESS_TOOL as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: EXPRESS_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Output language: ${langName}.${aud}\n\nHere is what I'm trying to say:\n"""${text}"""`,
      },
    ],
  });
  return firstToolInput<ExpressResult>(msg);
}

function firstToolInput<T>(msg: Anthropic.Message): T {
  const block = msg.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("No tool output");
  return block.input as T;
}

function splitDataUrl(dataUrl: string): { mediaType: string; data: string } {
  const m = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!m) throw new Error("Image must be a base64 data URL");
  return { mediaType: m[1], data: m[2] };
}

function json(payload: ApiResponse) {
  return NextResponse.json(payload, { status: payload.ok ? 200 : 400 });
}
