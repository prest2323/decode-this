// EXTRACT — owned by Michael (backend, heavy track). Turns an uploaded document
// into a DocumentModel. Gemini (default) / Anthropic (fallback) read the file
// multimodally and return JSON; the SHARED normalizeDoc() in lib/ai.ts is the
// single trust boundary every reply passes through (clamps rects, fills es,
// derives the grouped spotlight, sorts the tour, guarantees one active step).
// With no key — or on ANY failure — we return the SBA mock, so the demo can
// never hang on the network.
//
// NOTE on pages: the model returns docType/summary/topFlags/requirements, NOT the
// rendered page images. Rects are normalized [0..1] so the canvas can overlay them
// on whatever it renders from the original upload. Populating DocumentModel.pages
// for a live PDF is the canvas/integration seam (Sawyer/Preston). The mock ships
// real pages, so the offline demo is fully rendered.
import type { Schema } from "@google/genai";
import type { AnalyzeRequest, DocumentModel } from "@/lib/types";
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
    messages: [{ role: "user", content: [fileBlock, { type: "text", text: EXTRACT_SYSTEM }] as never }],
  });
  const block = msg.content.find((b) => b.type === "tool_use");
  return block && block.type === "tool_use" ? block.input : {};
}

/**
 * Analyze an uploaded document into a DocumentModel. Route by provider, run the
 * raw reply through the shared normalizeDoc, and fall back to the SBA mock on
 * anything weird (no key, network error, off-spec reply, or zero requirements).
 */
export async function analyzeDocument(req: AnalyzeRequest): Promise<DocumentModel> {
  const fileName = req.fileName || MOCK_DOC.fileName;
  const fallback: DocumentModel = { ...MOCK_DOC, fileName };
  const which = provider();
  if (which === "mock") return fallback;

  try {
    const raw = which === "gemini" ? await extractWithGemini(req) : await extractWithAnthropic(req);
    const model = normalizeDoc(raw, fileName);
    // A reply with no requirements is useless on stage — protect the demo.
    return model.requirements.length > 0 ? model : fallback;
  } catch (e) {
    console.error("extract failed, falling back to mock:", e);
    return fallback;
  }
}

/** Queue-named alias for the analyzer entry point. */
export const extractDoc = analyzeDocument;
