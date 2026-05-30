// CHAT — owned by Michael (backend, heavy track). Answers questions grounded in
// the current document + the step the user is on. The template ships a grounded
// MOCK answerer (keyword-matched against the document's own flags/requirements)
// so the chat works offline and on stage. Michael swaps in the real model call
// (context-stuff the DocumentModel + active requirement) but keeps this fallback.
import type { ChatRequest, ChatResult, Lang } from "@/lib/types";
import { provider } from "@/lib/ai";

export async function chatAnswer(req: ChatRequest): Promise<ChatResult> {
  if (provider() === "mock") return groundedMockAnswer(req);
  try {
    // TODO (Michael): real grounded answer with CHAT_SYSTEM — pass the doc
    // summary + requirement titles/guidance + the active requirement as context,
    // bilingual, never invent facts. Fall back to the mock on any error.
    return groundedMockAnswer(req);
  } catch {
    return groundedMockAnswer(req);
  }
}

function pick(lang: Lang, en: string, es: string): string {
  return lang === "es" ? es : en;
}

function groundedMockAnswer(req: ChatRequest): ChatResult {
  const { lang, doc, question } = req;
  const q = question.toLowerCase();
  const active = doc.requirements.find((r) => r.id === req.activeRequirementId) ?? null;
  const cited: string[] = [];

  if (/(personal )?guarant|garant/.test(q)) {
    const r = doc.requirements.find((x) => x.flags.some((f) => f.kind === "legal-risk"));
    if (r) cited.push(r.id);
    return {
      answer: pick(
        lang,
        "A personal guarantee means you promise to repay the loan with your own money and property if the business can't. For an SBA 7(a) loan, every owner of 20% or more has to sign one. It's normal — but take it seriously, because your personal credit and assets can be on the line.",
        "Una garantía personal significa que usted promete pagar el préstamo con su propio dinero y bienes si el negocio no puede. En un préstamo SBA 7(a), cada dueño con 20% o más debe firmarla. Es normal, pero tómelo en serio: su crédito y propiedad personal pueden estar en juego.",
      ),
      citedRequirementIds: cited,
    };
  }

  if (/(fee|cost|charge|price|tarifa|cuota|costo|precio)/.test(q)) {
    const fee = doc.topFlags.find((f) => f.kind === "fee");
    return {
      answer: pick(
        lang,
        `The main upfront cost is the SBA guaranty fee${fee ? ` (${fee.label.en})` : ""}. It's usually rolled into the loan rather than paid out of pocket on day one — but confirm the exact amount with your lender.`,
        `El costo inicial principal es la tarifa de garantía de la SBA${fee ? ` (${fee.label.es})` : ""}. Normalmente se incluye en el préstamo en vez de pagarse de su bolsillo el primer día, pero confirme el monto exacto con su prestamista.`,
      ),
    };
  }

  if (/(deadline|due|when|fecha|plazo|vence|cuándo|cuando)/.test(q)) {
    const d = doc.topFlags.find((f) => f.kind === "deadline");
    return {
      answer: d
        ? pick(
            lang,
            `The key deadline is ${d.label.en}. Don't miss it — incomplete applications usually get pushed to the next cycle.`,
            `La fecha límite clave es ${d.label.es}. No la pierda: las solicitudes incompletas suelen pasar al siguiente ciclo.`,
          )
        : pick(
            lang,
            "I don't see a hard deadline on this document, but submit as early as you can.",
            "No veo una fecha límite estricta en este documento, pero envíelo lo antes posible.",
          ),
    };
  }

  if (/(tax|return|impuesto|declaraci)/.test(q)) {
    return {
      answer: pick(
        lang,
        "You'll need your most recent business tax return — and often personal returns for each owner too. Have the 2025 return ready as a PDF before you start the financial sections.",
        "Necesitará su declaración de impuestos comercial más reciente, y a menudo también las personales de cada dueño. Tenga lista la declaración de 2025 en PDF antes de comenzar las secciones financieras.",
      ),
    };
  }

  if (active) {
    cited.push(active.id);
    return {
      answer: pick(
        lang,
        `For "${active.title.en}": ${active.guidance.en}`,
        `Para "${active.title.es}": ${active.guidance.es}`,
      ),
      citedRequirementIds: cited,
    };
  }

  return {
    answer: pick(
      lang,
      `This is ${doc.docType.en}. ${doc.summary.en} Ask me about any step, a fee, a deadline, or what a term means.`,
      `Esto es ${doc.docType.es}. ${doc.summary.es} Pregúnteme sobre cualquier paso, una tarifa, una fecha límite o qué significa un término.`,
    ),
  };
}
