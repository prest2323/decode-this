// /api/decode — owned by Lead (Claude 5x #1).
// Handles BOTH directions: mode "decode" (image -> plain language)
// and mode "express" (messy thought -> polished words).
// If ANTHROPIC_API_KEY is missing, returns mock data so the app still runs.
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ApiRequest, ApiResponse, DecodeResult, ExpressResult } from "@/lib/types";
import { MOCK_DECODE, MOCK_EXPRESS } from "@/lib/mock";
import { DECODE_SYSTEM, EXPRESS_SYSTEM, DECODE_TOOL, EXPRESS_TOOL } from "@/lib/prompt";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.MODEL || "claude-sonnet-4-6";

export async function POST(req: NextRequest) {
  let body: ApiRequest;
  try {
    body = (await req.json()) as ApiRequest;
  } catch {
    return json({ ok: false, error: "Invalid JSON." });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  // No key? Return mock so teammates can develop the UI without secrets.
  if (!key) {
    if (body.mode === "express") return json({ ok: true, mode: "express", result: MOCK_EXPRESS });
    return json({ ok: true, mode: "decode", result: MOCK_DECODE });
  }

  const client = new Anthropic({ apiKey: key });

  try {
    if (body.mode === "decode") {
      const result = await runDecode(client, body.image);
      return json({ ok: true, mode: "decode", result });
    }
    if (body.mode === "express") {
      const result = await runExpress(client, body.text, body.lang, body.audience);
      return json({ ok: true, mode: "express", result });
    }
    return json({ ok: false, error: "Unknown mode." });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: "Decode failed. Try again." });
  }
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
