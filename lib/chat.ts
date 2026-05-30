// CHAT — owned by Michael (backend, heavy track). Answers questions grounded in
// the current document + the step the user is on. With no key (or on any error)
// it returns a grounded MOCK answer (keyword-matched against the document's own
// flags/requirements) so chat works offline and on stage. With a key it context-
// stuffs the DocumentModel + the active requirement into CHAT_SYSTEM, never
// inventing facts, and returns the requirement ids it grounded on.
import type { ChatRequest, ChatResult, Lang } from "@/lib/types";
import { provider, geminiClient, anthropicClient, GEMINI_MODEL, ANTHROPIC_MODEL } from "@/lib/ai";
import { CHAT_SYSTEM } from "@/lib/prompt";

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** Reject if `p` hasn't settled within `ms` (late settlement is swallowed). */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

/** One retry with backoff under a TOTAL time budget; on exhaustion the caller
 *  falls back to the grounded mock, so chat never hangs on stage. */
async function withRetry<T>(fn: () => Promise<T>, totalMs: number, label: string): Promise<T> {
  const deadline = Date.now() + totalMs;
  let lastErr: unknown;
  for (let i = 0; i < 2; i++) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    try {
      return await withTimeout(fn(), remaining, label);
    } catch (e) {
      lastErr = e;
      if (i === 0 && deadline - Date.now() > 600) await sleep(600);
    }
  }
  throw lastErr ?? new Error(`${label} failed`);
}

export async function chatAnswer(req: ChatRequest): Promise<ChatResult> {
  const which = provider();
  if (which === "mock") return groundedMockAnswer(req);
  try {
    const text = await withRetry(
      () => (which === "gemini" ? chatWithGemini(req) : chatWithAnthropic(req)),
      30_000,
      "chat",
    );
    const answer = text.trim();
    if (!answer) return groundedMockAnswer(req);
    return { answer, citedRequirementIds: deriveCited(req) };
  } catch (e) {
    console.error("chat failed, using grounded mock:", e);
    return groundedMockAnswer(req);
  }
}

/** Queue-named alias for the chat entry point. */
export const answer = chatAnswer;

function pick(lang: Lang, en: string, es: string): string {
  return lang === "es" ? es : en;
}

// ---------- live, grounded answer ----------

/** Stuff the whole document + the active step into a compact context block. */
function buildContext(req: ChatRequest): string {
  const { doc, lang, activeRequirementId } = req;
  const out: string[] = [];
  out.push(`DOCUMENT: ${pick(lang, doc.docType.en, doc.docType.es)}`);
  out.push(`SUMMARY: ${pick(lang, doc.summary.en, doc.summary.es)}`);
  if (doc.topFlags.length) {
    out.push(`FLAGS: ${doc.topFlags.map((f) => pick(lang, f.label.en, f.label.es)).join("; ")}`);
  }
  out.push("STEPS:");
  for (const r of doc.requirements) {
    out.push(`- [${r.id}] ${pick(lang, r.title.en, r.title.es)}: ${pick(lang, r.guidance.en, r.guidance.es)}`);
  }
  const active = doc.requirements.find((r) => r.id === activeRequirementId);
  if (active) {
    out.push(
      `\nCURRENT STEP (focus your answer here): [${active.id}] ${pick(lang, active.title.en, active.title.es)}: ${pick(lang, active.guidance.en, active.guidance.es)}`,
    );
  }
  return out.join("\n");
}

/** Which requirement ids the answer relates to (active step + keyword overlap). */
function deriveCited(req: ChatRequest): string[] {
  const { doc, activeRequirementId, question } = req;
  const ids = new Set<string>();
  if (activeRequirementId && doc.requirements.some((r) => r.id === activeRequirementId)) {
    ids.add(activeRequirementId);
  }
  const words = question.toLowerCase().split(/\W+/).filter((w) => w.length >= 4);
  for (const r of doc.requirements) {
    const hay = `${r.title.en} ${r.title.es} ${r.guidance.en} ${r.guidance.es}`.toLowerCase();
    if (words.some((w) => hay.includes(w))) ids.add(r.id);
  }
  return [...ids].slice(0, 4);
}

function askLang(lang: Lang): string {
  return lang === "es" ? "Spanish" : "English";
}

async function chatWithGemini(req: ChatRequest): Promise<string> {
  const res = await geminiClient().models.generateContent({
    model: GEMINI_MODEL,
    contents: [
      { role: "user", parts: [{ text: `${buildContext(req)}\n\nQuestion (answer in ${askLang(req.lang)}): ${req.question}` }] },
    ],
    config: { systemInstruction: CHAT_SYSTEM, temperature: 0.3 },
  });
  return res.text ?? "";
}

async function chatWithAnthropic(req: ChatRequest): Promise<string> {
  const msg = await anthropicClient().messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: 1024,
    system: CHAT_SYSTEM,
    messages: [
      { role: "user", content: `${buildContext(req)}\n\nQuestion (answer in ${askLang(req.lang)}): ${req.question}` },
    ],
  });
  return msg.content.map((b) => (b.type === "text" ? b.text : "")).join("\n");
}

// ---------- offline grounded mock (also the failure fallback) ----------

function groundedMockAnswer(req: ChatRequest): ChatResult {
  const { lang, doc, question } = req;
  const q = question.toLowerCase();
  const active = doc.requirements.find((r) => r.id === req.activeRequirementId) ?? null;
  const cited: string[] = [];

  // Rich SBA-specific copy ONLY when this really is the SBA hero; every other
  // document gets answers grounded in ITS OWN flags/requirements (never SBA facts).
  const isSba = doc.id === "mock_sba_7a";
  const flagOf = (kind: string) =>
    doc.topFlags.find((f) => f.kind === kind) ?? doc.requirements.flatMap((r) => r.flags).find((f) => f.kind === kind);

  // Open-ended legal / financial ADVICE (decision / panic / rights questions) →
  // route to a professional, never guess. Checked FIRST so a question that also
  // mentions a fee/deadline/tax keyword ("should I pay this fee or is it a scam?")
  // still gets the safe hand-off instead of a definitive informational answer.
  if (
    /should i (sign|sue|pay|agree|do)|is (this|it) (legal|safe|a scam)|can they (take|sue|garnish|deport|evict|repossess)|will (this|it).*(credit|immigration|deport)|lawsuit|garnish|repossess|\bdeport|\bevict|my rights|legal advice|deber[ií]a (firmar|pagar|demand)|es (legal|seguro|una estafa)|pueden (quitar|demand|deportar|desaloj|embargar)|mis derechos|consejo legal/.test(
      q,
    )
  ) {
    if (active) cited.push(active.id);
    return {
      answer: pick(
        lang,
        "That's an important question, and the safe answer depends on your exact situation — it's worth a few minutes with a professional. For legal questions, many courts and nonprofits offer free legal aid; for money questions, a nonprofit financial counselor or your lender can help. I can explain what this document says, but I can't give legal or financial advice.",
        "Esa es una pregunta importante, y la respuesta segura depende de su situación exacta — vale la pena unos minutos con un profesional. Para temas legales, muchas cortes y organizaciones sin fines de lucro ofrecen asistencia legal gratuita; para temas de dinero, un consejero financiero sin fines de lucro o su prestamista pueden ayudar. Puedo explicar lo que dice este documento, pero no puedo dar consejo legal ni financiero.",
      ),
      citedRequirementIds: cited,
    };
  }

  if (/(personal )?guarant|garant/.test(q)) {
    const r = doc.requirements.find((x) => x.flags.some((f) => f.kind === "legal-risk"));
    if (r) cited.push(r.id);
    if (isSba) {
      return {
        answer: pick(
          lang,
          "A personal guarantee means you promise to repay the loan with your own money and property if the business can't. For an SBA 7(a) loan, every owner of 20% or more has to sign one. It's normal — but take it seriously, because your personal credit and assets can be on the line.",
          "Una garantía personal significa que usted promete pagar el préstamo con su propio dinero y bienes si el negocio no puede. En un préstamo SBA 7(a), cada dueño con 20% o más debe firmarla. Es normal, pero tómelo en serio: su crédito y propiedad personal pueden estar en juego.",
        ),
        citedRequirementIds: cited,
      };
    }
    if (r) {
      return {
        answer: pick(
          lang,
          `On this document, that's the legal-risk step "${r.title.en}": ${r.guidance.en}`,
          `En este documento, ese es el paso de riesgo legal "${r.title.es}": ${r.guidance.es}`,
        ),
        citedRequirementIds: cited,
      };
    }
    // no legal-risk step on this doc → fall through to the active-step / summary answer
  }

  if (/(fee|cost|charge|price|tarifa|cuota|costo|precio)/.test(q)) {
    const fee = flagOf("fee");
    if (isSba) {
      return {
        answer: pick(
          lang,
          `The main upfront cost is the SBA guaranty fee${fee ? ` (${fee.label.en})` : ""}. It's usually rolled into the loan rather than paid out of pocket on day one — but confirm the exact amount with your lender.`,
          `El costo inicial principal es la tarifa de garantía de la SBA${fee ? ` (${fee.label.es})` : ""}. Normalmente se incluye en el préstamo en vez de pagarse de su bolsillo el primer día, pero confirme el monto exacto con su prestamista.`,
        ),
      };
    }
    if (fee) {
      return {
        answer: pick(
          lang,
          `The cost on this document is ${fee.label.en}. Confirm the exact amount with whoever issued it before you pay.`,
          `El costo en este documento es ${fee.label.es}. Confirme el monto exacto con quien lo emitió antes de pagar.`,
        ),
      };
    }
    return {
      answer: pick(
        lang,
        "I don't see a specific fee on this document. If you're worried about a cost, ask whoever sent it to confirm.",
        "No veo una tarifa específica en este documento. Si le preocupa un costo, pregunte a quien se lo envió para confirmar.",
      ),
    };
  }

  if (/(deadline|due|when|fecha|plazo|vence|cuándo|cuando)/.test(q)) {
    const d = flagOf("deadline");
    return {
      answer: d
        ? pick(
            lang,
            `The key deadline is ${d.label.en}. Don't miss it — late or incomplete submissions can set you back.`,
            `La fecha límite clave es ${d.label.es}. No la pierda: enviar tarde o incompleto puede atrasarlo.`,
          )
        : pick(
            lang,
            "I don't see a hard deadline on this document, but it's safest to act early.",
            "No veo una fecha límite estricta en este documento, pero lo más seguro es actuar pronto.",
          ),
    };
  }

  if (/(tax|return|impuesto|declaraci)/.test(q)) {
    const taxReq = doc.requirements.find((r) =>
      /tax|return|impuesto|declaraci/i.test(`${r.title.en} ${r.title.es} ${r.guidance.en} ${r.guidance.es}`),
    );
    if (taxReq) {
      cited.push(taxReq.id);
      return {
        answer: pick(lang, `For "${taxReq.title.en}": ${taxReq.guidance.en}`, `Para "${taxReq.title.es}": ${taxReq.guidance.es}`),
        citedRequirementIds: cited,
      };
    }
    // no tax-related step on this doc → fall through (don't assert SBA tax facts)
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
