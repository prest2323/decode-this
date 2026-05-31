// insights.ts — turns the document + what the user has filled in into plain-language
// insights. Two flavors:
//   • stepInsight(req)   → the one micro-note shown at the bottom of the guide card
//                          ("These 4 boxes are one step", "This is legally binding"…).
//   • overviewInsights() → the consequence list on the Overview tab
//                          ("Because you entered an EIN, you'll likely need …").
// Rule-based so it works instantly offline (the demo); fetchAiInsights() layers richer
// AI-written insights on top for real uploaded documents (the "hybrid" path).
import type { DocumentModel, Requirement, Field, Lang } from "@/lib/types";

export type InsightKind = "consequence" | "risk" | "deadline" | "fee" | "tip" | "progress";

export interface Insight {
  id: string;
  kind: InsightKind;
  text: Record<Lang, string>;
  requirementId?: string;
  source?: "rule" | "ai";
}

const has = (s: string | undefined, ...needles: string[]) =>
  !!s && needles.some((n) => s.toLowerCase().includes(n));

const fieldText = (f: Field) => `${f.name} ${f.label.en} ${f.label.es}`.toLowerCase();
const isFilled = (f: Field) =>
  f.value !== null && f.value !== undefined && f.value !== false && String(f.value).trim() !== "";

// ── The bottom-of-the-card micro-insight for the ACTIVE step ──────────────────
export function stepInsight(req: Requirement | null): Record<Lang, string> | null {
  if (!req) return null;
  const n = req.fields.length;

  if (n >= 2) {
    return {
      en: `These ${n} boxes are one step — fill them all before moving on.`,
      es: `Estas ${n} casillas son un paso — complételas todas antes de continuar.`,
    };
  }
  if (req.type === "sign") {
    return {
      en: "Signing here is legally binding — only sign once everything above is correct.",
      es: "Firmar aquí es legalmente vinculante — firme solo cuando todo lo anterior esté correcto.",
    };
  }
  if (req.type === "pay-fee") {
    return {
      en: "This step involves a fee. Confirm the exact amount before you pay.",
      es: "Este paso implica una tarifa. Confirme el monto exacto antes de pagar.",
    };
  }
  if (req.type === "gather-document") {
    return {
      en: "You'll need to find and attach a document for this step — gather it before you continue.",
      es: "Necesitará buscar y adjuntar un documento para este paso — téngalo listo antes de continuar.",
    };
  }
  if (req.type === "external-action") {
    return {
      en: "This step happens outside the form — do it, then come back and check it off.",
      es: "Este paso ocurre fuera del formulario — hágalo, luego regrese y márquelo.",
    };
  }
  const flag = req.flags[0];
  if (flag) return flag.label;
  if (req.difficulty === "hard") {
    return {
      en: "Take your time with this one — it's the trickiest step on the form.",
      es: "Tómese su tiempo con este — es el paso más complicado del formulario.",
    };
  }
  return null;
}

// ── The Overview consequence list, derived from what's been filled in ─────────
export function overviewInsights(doc: DocumentModel | null): Insight[] {
  if (!doc) return [];
  const out: Insight[] = [];
  const push = (id: string, kind: InsightKind, en: string, es: string, requirementId?: string) =>
    out.push({ id, kind, text: { en, es }, requirementId, source: "rule" });

  const allFields = doc.requirements.flatMap((r) => r.fields.map((f) => ({ f, r })));
  const filled = allFields.filter(({ f }) => isFilled(f));

  // Field-driven consequences (generic patterns that hold across document types).
  for (const { f, r } of filled) {
    const k = fieldText(f);
    if (has(k, "ein", "tax id", "employer identification")) {
      push(`ein-${f.id}`, "consequence",
        "Because you entered an EIN, have your IRS EIN confirmation letter (CP-575) ready — many filers are asked to attach it.",
        "Como ingresó un EIN, tenga lista su carta de confirmación del EIN del IRS (CP-575) — a menudo piden adjuntarla.", r.id);
    } else if (has(k, "ssn", "social security", "seguro social")) {
      push(`ssn-${f.id}`, "risk",
        "You entered a Social Security Number — only submit this form through the official channel, never by email.",
        "Ingresó un número de Seguro Social — envíe este formulario solo por el canal oficial, nunca por correo.", r.id);
    } else if (has(k, "amount", "loan", "income", "revenue", "monto", "ingreso", "préstamo")) {
      push(`amount-${f.id}`, "consequence",
        "Based on the amount you entered, you'll likely need supporting financial statements (e.g. tax returns or bank statements).",
        "Según el monto que ingresó, probablemente necesitará estados financieros de respaldo (declaraciones de impuestos o estados de cuenta).", r.id);
    } else if (has(k, "address", "street", "city", "zip", "dirección", "calle", "ciudad")) {
      push(`addr-${f.id}`, "tip",
        "Make sure the address you entered matches your official records exactly — mismatches are a common reason forms get returned.",
        "Asegúrese de que la dirección coincida exactamente con sus registros oficiales — las discrepancias hacen que devuelvan formularios.", r.id);
    } else if (has(k, "name", "legal name", "nombre")) {
      push(`name-${f.id}`, "tip",
        "Use your full legal name exactly as it appears on official ID — nicknames can delay processing.",
        "Use su nombre legal completo tal como aparece en su identificación oficial — los apodos pueden retrasar el trámite.", r.id);
    } else if (has(k, "date", "fecha")) {
      push(`date-${f.id}`, "tip",
        "Double-check the date format the form expects (MM/DD/YYYY in the US).",
        "Verifique el formato de fecha que espera el formulario (MM/DD/AAAA en EE. UU.).", r.id);
    }
  }

  // Flag-driven consequences (always relevant, filled or not).
  for (const flag of doc.topFlags) {
    if (flag.kind === "deadline") {
      push(`flag-deadline`, "deadline",
        `There's a deadline${flag.date ? ` (${flag.date})` : ""} — finish and submit before then, late filings can reset the process.`,
        `Hay una fecha límite${flag.date ? ` (${flag.date})` : ""} — termine y envíe antes, las entregas tardías pueden reiniciar el proceso.`);
    } else if (flag.kind === "fee") {
      push(`flag-fee`, "fee",
        `Expect a fee: ${flag.label.en}. Confirm the exact amount and who you pay before sending money.`,
        `Espere una tarifa: ${flag.label.es}. Confirme el monto exacto y a quién paga antes de enviar dinero.`);
    } else if (flag.kind === "legal-risk") {
      push(`flag-legal`, "risk",
        `${flag.label.en} — this is a real legal commitment. If you're unsure, it's worth a few minutes with a professional.`,
        `${flag.label.es} — es un compromiso legal real. Si tiene dudas, vale la pena unos minutos con un profesional.`);
    } else if (flag.kind === "background-check") {
      push(`flag-bg`, "consequence",
        `${flag.label.en} — everyone involved will be checked, so make sure their details are accurate too.`,
        `${flag.label.es} — se verificará a todos los involucrados, así que asegúrese de que sus datos también sean exactos.`);
    } else if (flag.kind === "scam") {
      push(`flag-scam`, "risk",
        `${flag.label.en} — slow down and verify the sender before acting.`,
        `${flag.label.es} — deténgase y verifique al remitente antes de actuar.`);
    }
  }

  // A signature step that isn't done yet.
  const sign = doc.requirements.find((r) => r.type === "sign" && r.status !== "done");
  if (sign) {
    push(`sign-pending`, "consequence",
      "You'll need to sign before this document is complete — that's the last step.",
      "Deberá firmar antes de que el documento esté completo — ese es el último paso.", sign.id);
  }

  return out;
}

// ── Readiness / health figures for the Overview header ────────────────────────
export interface Health {
  doneSteps: number;
  totalSteps: number;
  stepPct: number;
  filledRequired: number;
  totalRequired: number;
  requiredPct: number;
  score: number; // 0..100 overall readiness
  riskCount: number;
}

export function documentHealth(doc: DocumentModel | null): Health {
  const reqs = doc?.requirements ?? [];
  const totalSteps = reqs.length;
  const doneSteps = reqs.filter((r) => r.status === "done").length;
  const requiredFields = reqs.flatMap((r) => r.fields).filter((f) => f.required);
  const totalRequired = requiredFields.length;
  const filledRequired = requiredFields.filter(isFilled).length;
  const stepPct = totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0;
  const requiredPct = totalRequired ? Math.round((filledRequired / totalRequired) * 100) : stepPct;
  // Readiness blends steps completed with required fields filled.
  const score = totalRequired ? Math.round(stepPct * 0.5 + requiredPct * 0.5) : stepPct;
  const riskCount = (doc?.topFlags ?? []).filter(
    (f) => f.kind === "legal-risk" || f.kind === "scam" || f.kind === "deadline",
  ).length;
  return { doneSteps, totalSteps, stepPct, filledRequired, totalRequired, requiredPct, score, riskCount };
}

// ── Hybrid: best-effort AI insights for REAL uploaded docs (not the mock) ──────
// Reuses /api/chat (mock-safe: returns grounded answers offline). Never throws.
export async function fetchAiInsights(doc: DocumentModel, lang: Lang): Promise<Insight[]> {
  try {
    const question =
      lang === "es"
        ? "Según lo que el usuario ya completó en este documento, dame 3 conclusiones breves y prácticas en viñetas (qué deberá proporcionar o tener en cuenta a continuación). Una oración cada una."
        : "Based on what the user has already filled in on this document, give me 3 short, practical takeaways as bullet points (what they'll need to provide or watch out for next). One sentence each.";
    const resp = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang, doc }),
    });
    const json = await resp.json();
    if (!json?.ok || typeof json.result?.answer !== "string") return [];
    const lines = json.result.answer
      .split(/\n|(?<=\.)\s+(?=[A-ZÁÉÍÓÚ])/)
      .map((s: string) => s.replace(/^[\s\-•*\d.)]+/, "").trim())
      .filter((s: string) => s.length > 12)
      .slice(0, 3);
    return lines.map((line: string, i: number) => ({
      id: `ai-${i}`,
      kind: "consequence" as InsightKind,
      text: { en: line, es: line } as Record<Lang, string>,
      source: "ai" as const,
    }));
  } catch {
    return [];
  }
}
