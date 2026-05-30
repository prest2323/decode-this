// POST /api/chat — a question grounded in the current document. Owned by Preston.
// With no API key, chatAnswer() returns a grounded mock answer, so chat works on
// stage. Body is a ChatRequest: { question, lang, doc, activeRequirementId? }.
import { chatAnswer } from "@/lib/chat";
import type { ApiResponse, ChatRequest, ChatResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json(
      { ok: false, error: "Invalid request body." } satisfies ApiResponse<ChatResult>,
      { status: 400 },
    );
  }
  if (!body?.question?.trim()) {
    return Response.json(
      { ok: false, error: "Ask a question first." } satisfies ApiResponse<ChatResult>,
      { status: 400 },
    );
  }
  if (!body?.doc) {
    return Response.json(
      { ok: false, error: "No document loaded." } satisfies ApiResponse<ChatResult>,
      { status: 400 },
    );
  }

  try {
    const result = await chatAnswer(body);
    return Response.json({ ok: true, result } satisfies ApiResponse<ChatResult>);
  } catch (e) {
    console.error("chat failed", e);
    return Response.json(
      { ok: false, error: "Chat is unavailable right now." } satisfies ApiResponse<ChatResult>,
      { status: 400 },
    );
  }
}
