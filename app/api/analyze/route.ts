// POST /api/analyze — a document in, a DocumentModel out. Owned by Preston.
// With no API key, analyzeDocument() returns the SBA mock, so this always works.
// ?demo=1 forces the mock (network-proof hero moment on stage).
import { analyzeDocument } from "@/lib/extract";
import { MOCK_DOC } from "@/lib/mock";
import type { AnalyzeRequest, ApiResponse, DocumentModel } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function ok(result: DocumentModel): Response {
  return Response.json({ ok: true, result } satisfies ApiResponse<DocumentModel>);
}
function fail(error: string, status = 400): Response {
  return Response.json(
    { ok: false, error } satisfies ApiResponse<DocumentModel>,
    { status },
  );
}

export async function POST(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.searchParams.get("demo") === "1") return ok(MOCK_DOC);

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return fail("Invalid request body.");
  }
  if (!body?.file) return fail("Drop a PDF or image first.");

  try {
    const result = await analyzeDocument(body);
    return ok(result);
  } catch (e) {
    console.error("analyze failed", e);
    return fail("We couldn't analyze that document. Please try again.");
  }
}
