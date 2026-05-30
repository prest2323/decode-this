// EXTRACT — owned by Michael (backend, heavy track). Turns an uploaded document
// into a DocumentModel. The template returns the SBA mock so the whole app runs
// and demos with no API key. Michael replaces the TODO with real multimodal
// extraction (see lib/prompt.ts) — but ALWAYS keep the mock fallback so the demo
// can never hang on the network.
import type { AnalyzeRequest, DocumentModel } from "@/lib/types";
import { MOCK_DOC } from "@/lib/mock";
import { provider } from "@/lib/ai";

export async function analyzeDocument(
  req: AnalyzeRequest,
): Promise<DocumentModel> {
  const fileName = req.fileName || MOCK_DOC.fileName;
  const fallback: DocumentModel = { ...MOCK_DOC, fileName };

  if (provider() === "mock") return fallback;

  try {
    // TODO (Michael): real extraction.
    //  1. If req.file is a PDF data URL, render/extract text + (later) AcroForm
    //     field rects; if it's an image, send it multimodally.
    //  2. Call Gemini/Anthropic with EXTRACT_SYSTEM forcing JSON that mirrors
    //     DocumentModel, then NORMALIZE (clamp rects to [0..1], coerce bilingual
    //     fields to {en,es}, default unknown enums) so an off-spec reply can
    //     never crash the UI.
    //  3. Group related fields into one fill-field requirement + spotlight bbox;
    //     score difficulty; order the tour.
    // Until that lands, even WITH a key we return the mock to guarantee the demo.
    return fallback;
  } catch {
    return fallback;
  }
}
