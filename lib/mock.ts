// MOCK — template owner Michael (he expands to more doc classes + variants).
// THE DEMO HEART: a full, coherent SBA 7(a) loan-application DocumentModel.
// With no API key, /api/analyze returns this, so the entire app runs and
// presents offline. Pages are rendered as inline SVG data URLs so the canvas
// shows a real-looking form with boxes the spotlights land on exactly.
import type { DocumentModel, Field, Rect, Requirement } from "@/lib/types";

// ---- page geometry -------------------------------------------------------
const PW = 850;
const PH = 1100; // US-letter-ish aspect ratio

interface Spec {
  key: string;
  page: number;
  // normalized [0..1], origin top-left
  x: number;
  y: number;
  w: number;
  h: number;
  en: string;
  es: string;
  kind: Field["kind"];
  name: string;
  required?: boolean;
  placeholder?: string;
}

// Every editable input on the form. The SVG pages and the Field rects are
// generated from THIS one list, so the drawn boxes and the overlays line up.
const SPECS: Spec[] = [
  // Page 0
  { key: "legalName", page: 0, x: 0.05, y: 0.14, w: 0.55, h: 0.035, en: "Business legal name", es: "Nombre legal del negocio", kind: "text", name: "business_legal_name", required: true },
  { key: "dba", page: 0, x: 0.64, y: 0.14, w: 0.31, h: 0.035, en: "DBA / trade name (if any)", es: "Nombre comercial (si aplica)", kind: "text", name: "dba" },
  { key: "street", page: 0, x: 0.05, y: 0.225, w: 0.62, h: 0.035, en: "Street address", es: "Dirección", kind: "text", name: "addr_street", required: true },
  { key: "city", page: 0, x: 0.05, y: 0.30, w: 0.30, h: 0.035, en: "City", es: "Ciudad", kind: "text", name: "addr_city", required: true },
  { key: "state", page: 0, x: 0.40, y: 0.30, w: 0.12, h: 0.035, en: "State", es: "Estado", kind: "text", name: "addr_state", required: true, placeholder: "CA" },
  { key: "zip", page: 0, x: 0.56, y: 0.30, w: 0.20, h: 0.035, en: "ZIP code", es: "Código postal", kind: "text", name: "addr_zip", required: true, placeholder: "93301" },
  { key: "ein", page: 0, x: 0.05, y: 0.39, w: 0.30, h: 0.035, en: "EIN (Tax ID)", es: "EIN (Id. fiscal)", kind: "text", name: "ein", required: true, placeholder: "12-3456789" },
  { key: "naics", page: 0, x: 0.40, y: 0.39, w: 0.30, h: 0.035, en: "NAICS industry code", es: "Código de industria NAICS", kind: "text", name: "naics" },
  { key: "loanAmount", page: 0, x: 0.05, y: 0.48, w: 0.30, h: 0.035, en: "Loan amount requested", es: "Monto del préstamo solicitado", kind: "number", name: "loan_amount", required: true, placeholder: "$150,000" },
  { key: "ownerName", page: 0, x: 0.05, y: 0.62, w: 0.40, h: 0.035, en: "Owner full name", es: "Nombre completo del dueño", kind: "text", name: "owner_name", required: true },
  { key: "ownerPct", page: 0, x: 0.50, y: 0.62, w: 0.20, h: 0.035, en: "Ownership %", es: "% de propiedad", kind: "number", name: "owner_pct", required: true, placeholder: "100" },
  // Page 1
  { key: "guarantyAck", page: 1, x: 0.05, y: 0.31, w: 0.028, h: 0.022, en: "I understand the personal guarantee", es: "Entiendo la garantía personal", kind: "checkbox", name: "guaranty_ack", required: true },
  { key: "signature", page: 1, x: 0.05, y: 0.78, w: 0.45, h: 0.045, en: "Signature", es: "Firma", kind: "signature", name: "signature", required: true },
  { key: "sigDate", page: 1, x: 0.55, y: 0.78, w: 0.25, h: 0.045, en: "Date", es: "Fecha", kind: "date", name: "sign_date", required: true, placeholder: "MM/DD/YYYY" },
];

function fieldOf(key: string): Field {
  const s = SPECS.find((x) => x.key === key);
  if (!s) throw new Error(`unknown field spec: ${key}`);
  return {
    id: `f_${s.key}`,
    name: s.name,
    kind: s.kind,
    label: { en: s.en, es: s.es },
    rect: { page: s.page, x: s.x, y: s.y, w: s.w, h: s.h },
    value: s.kind === "checkbox" ? false : null,
    required: !!s.required,
    placeholder: s.placeholder,
  };
}

// Bounding box (with a little padding) of a group of fields = the grouped
// spotlight. This is the "street+city+state+zip in ONE spotlight" behavior.
function bbox(keys: string[]): Rect {
  const specs = keys.map((k) => SPECS.find((s) => s.key === k)!);
  const page = specs[0].page;
  const minX = Math.min(...specs.map((s) => s.x));
  const minY = Math.min(...specs.map((s) => s.y));
  const maxX = Math.max(...specs.map((s) => s.x + s.w));
  const maxY = Math.max(...specs.map((s) => s.y + s.h));
  const pad = 0.012;
  return {
    page,
    x: Math.max(0, minX - pad),
    y: Math.max(0, minY - pad),
    w: Math.min(1, maxX - minX + pad * 2),
    h: Math.min(1, maxY - minY + pad * 2),
  };
}

// ---- the rendered "pages" (inline SVG so boxes line up with the rects) ----
function esc(s: string): string {
  return s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c] as string);
}

function svgPage(headers: { t: string; size: number; bold?: boolean }[], page: number): string {
  const boxes = SPECS.filter((s) => s.page === page)
    .map((s) => {
      const x = s.x * PW;
      const y = s.y * PH;
      const w = s.w * PW;
      const h = s.h * PH;
      const label = `<text x="${x}" y="${y - 6}" font-size="13" fill="#475569" font-family="Arial, sans-serif">${esc(s.en)}${s.required ? " *" : ""}</text>`;
      const rect = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" rx="3"/>`;
      return label + rect;
    })
    .join("");
  const head = headers
    .map(
      (hd, i) =>
        `<text x="40" y="${56 + i * 24}" font-size="${hd.size}" fill="${hd.bold ? "#0f172a" : "#64748b"}" font-family="Arial, sans-serif" font-weight="${hd.bold ? "700" : "400"}">${esc(hd.t)}</text>`,
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">` +
    `<rect width="${PW}" height="${PH}" fill="#eef2f7"/>` +
    `<rect x="18" y="18" width="${PW - 36}" height="${PH - 36}" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>` +
    head +
    boxes +
    `</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

const PAGE0 = svgPage(
  [
    { t: "U.S. Small Business Administration", size: 22, bold: true },
    { t: "Form 1919 — 7(a) Borrower Information Form  (page 1 of 2)", size: 14 },
    { t: "Section I — Business & Loan", size: 14, bold: true },
  ],
  0,
);
const PAGE1 = svgPage(
  [
    { t: "U.S. Small Business Administration", size: 22, bold: true },
    { t: "Form 1919 — 7(a) Borrower Information Form  (page 2 of 2)", size: 14 },
    { t: "Section II — Certifications, Fees & Signature", size: 14, bold: true },
  ],
  1,
);

// ---- the requirements (the checklist + the tour) -------------------------
const requirements: Requirement[] = [
  {
    id: "r_legalname",
    order: 1,
    type: "fill-field",
    difficulty: "easy",
    status: "active",
    title: { en: "Enter your business's legal name", es: "Ingrese el nombre legal de su negocio" },
    guidance: {
      en: "Write the exact legal name your business is registered under — the name on your business license or formation papers, not a nickname. If you also operate under a different public name, put that in the DBA box.",
      es: "Escriba el nombre legal exacto con el que está registrado su negocio — el que aparece en su licencia o documentos de formación, no un apodo. Si opera con un nombre público distinto, póngalo en la casilla DBA.",
    },
    flags: [],
    fields: [fieldOf("legalName"), fieldOf("dba")],
    spotlight: bbox(["legalName", "dba"]),
  },
  {
    id: "r_address",
    order: 2,
    type: "fill-field",
    difficulty: "easy",
    status: "todo",
    title: { en: "Fill in your business mailing address", es: "Complete la dirección postal de su negocio" },
    guidance: {
      en: "Enter the full address together — street, city, state, and ZIP. Use the physical address where your business operates, not a P.O. box, unless that's the only mail you receive.",
      es: "Ingrese la dirección completa junta — calle, ciudad, estado y código postal. Use la dirección física donde opera su negocio, no un apartado postal, a menos que sea el único correo que recibe.",
    },
    flags: [{ kind: "tip", label: { en: "All four boxes are one step", es: "Las cuatro casillas son un solo paso" } }],
    fields: [fieldOf("street"), fieldOf("city"), fieldOf("state"), fieldOf("zip")],
    spotlight: bbox(["street", "city", "state", "zip"]),
  },
  {
    id: "r_ein",
    order: 3,
    type: "fill-field",
    difficulty: "medium",
    status: "todo",
    title: { en: "Enter your EIN and industry code", es: "Ingrese su EIN y código de industria" },
    guidance: {
      en: "Your EIN is the 9-digit tax ID the IRS gave your business (format 12-3456789). The NAICS code describes your industry — if you don't know it, you can look it up by your business type, but it's not the hardest part here.",
      es: "Su EIN es el número de identificación fiscal de 9 dígitos que el IRS le dio a su negocio (formato 12-3456789). El código NAICS describe su industria — si no lo sabe, puede buscarlo por tipo de negocio, pero no es lo más difícil aquí.",
    },
    flags: [{ kind: "tip", label: { en: "No EIN? See the next step", es: "¿Sin EIN? Vea el siguiente paso" } }],
    fields: [fieldOf("ein"), fieldOf("naics")],
    spotlight: bbox(["ein", "naics"]),
  },
  {
    id: "r_taxreturn",
    order: 4,
    type: "gather-document",
    difficulty: "medium",
    status: "todo",
    title: { en: "Upload your 2025 business tax return", es: "Suba su declaración de impuestos comercial 2025" },
    guidance: {
      en: "Have your most recent business tax return ready as a PDF before the financial sections. Lenders use it to verify income. If your business is new, ask your lender what they'll accept instead.",
      es: "Tenga lista su declaración de impuestos comercial más reciente en PDF antes de las secciones financieras. Los prestamistas la usan para verificar ingresos. Si su negocio es nuevo, pregunte a su prestamista qué aceptan en su lugar.",
    },
    flags: [{ kind: "tip", label: { en: "Have it ready before you start", es: "Téngala lista antes de empezar" } }],
    fields: [],
    spotlight: null,
  },
  {
    id: "r_getein",
    order: 5,
    type: "external-action",
    difficulty: "medium",
    status: "todo",
    title: { en: "Get an EIN from the IRS (only if you don't have one)", es: "Obtenga un EIN del IRS (solo si no tiene uno)" },
    guidance: {
      en: "If you don't already have an EIN, you can get one free in minutes on the IRS website — don't pay a third party for it. You'll need it before you can finish this application.",
      es: "Si aún no tiene un EIN, puede obtener uno gratis en minutos en el sitio del IRS — no le pague a un tercero por esto. Lo necesitará antes de poder terminar esta solicitud.",
    },
    flags: [{ kind: "tip", label: { en: "Free on irs.gov", es: "Gratis en irs.gov" } }],
    fields: [],
    spotlight: null,
  },
  {
    id: "r_loan",
    order: 6,
    type: "fill-field",
    difficulty: "easy",
    status: "todo",
    title: { en: "Enter the loan amount you're requesting", es: "Ingrese el monto del préstamo que solicita" },
    guidance: {
      en: "Put the total amount you want to borrow. Ask for what you can clearly justify with your plan — lenders look closely at whether the amount matches your revenue and use of funds.",
      es: "Ponga el monto total que desea pedir prestado. Pida lo que pueda justificar con su plan — los prestamistas revisan de cerca si el monto coincide con sus ingresos y el uso de los fondos.",
    },
    flags: [],
    fields: [fieldOf("loanAmount")],
    spotlight: bbox(["loanAmount"]),
  },
  {
    id: "r_ownership",
    order: 7,
    type: "fill-field",
    difficulty: "hard",
    status: "todo",
    title: { en: "Declare ownership (each owner of 20%+)", es: "Declare la propiedad (cada dueño con 20%+)" },
    guidance: {
      en: "List every owner who holds 20% or more of the business. This matters a lot: each of those owners must personally guarantee the loan and will go through a background check. Be exact — the percentages should add up correctly.",
      es: "Liste a cada dueño que posea 20% o más del negocio. Esto importa mucho: cada uno de esos dueños debe garantizar personalmente el préstamo y pasará por una verificación de antecedentes. Sea exacto — los porcentajes deben sumar correctamente.",
    },
    flags: [
      { kind: "background-check", label: { en: "Owners 20%+ are background-checked", es: "Dueños con 20%+ pasan verificación de antecedentes" } },
      { kind: "legal-risk", label: { en: "Triggers a personal guarantee", es: "Activa una garantía personal" } },
    ],
    fields: [fieldOf("ownerName"), fieldOf("ownerPct")],
    spotlight: bbox(["ownerName", "ownerPct"]),
  },
  {
    id: "r_fee",
    order: 8,
    type: "pay-fee",
    difficulty: "hard",
    status: "todo",
    title: { en: "Understand the SBA guaranty fee", es: "Entienda la tarifa de garantía de la SBA" },
    guidance: {
      en: "SBA 7(a) loans carry a one-time guaranty fee based on the loan size. It's usually rolled into the loan rather than paid up front, but it's real money — ask your lender for the exact figure for your amount.",
      es: "Los préstamos SBA 7(a) tienen una tarifa de garantía única según el tamaño del préstamo. Normalmente se incluye en el préstamo en vez de pagarse por adelantado, pero es dinero real — pida a su prestamista la cifra exacta para su monto.",
    },
    flags: [{ kind: "fee", label: { en: "≈ $2,500 guaranty fee", es: "≈ $2,500 de tarifa de garantía" } }],
    fields: [],
    spotlight: null,
  },
  {
    id: "r_sign",
    order: 9,
    type: "sign",
    difficulty: "medium",
    status: "todo",
    title: { en: "Acknowledge the terms, then sign and date", es: "Reconozca los términos, luego firme y feche" },
    guidance: {
      en: "Check the box to confirm you understand the personal guarantee, then sign and date the form. Don't sign until the rest is complete and correct — your signature certifies everything above is true.",
      es: "Marque la casilla para confirmar que entiende la garantía personal, luego firme y feche el formulario. No firme hasta que el resto esté completo y correcto — su firma certifica que todo lo anterior es verdadero.",
    },
    flags: [{ kind: "deadline", label: { en: "Submit by Jun 30, 2026", es: "Envíe antes del 30 de jun, 2026" }, date: "2026-06-30" }],
    fields: [fieldOf("guarantyAck"), fieldOf("signature"), fieldOf("sigDate")],
    spotlight: bbox(["guarantyAck", "signature", "sigDate"]),
  },
];

export const MOCK_DOC: DocumentModel = {
  id: "mock_sba_7a",
  fileName: "SBA-Form-1919.pdf",
  docType: { en: "SBA 7(a) loan application", es: "Solicitud de préstamo SBA 7(a)" },
  summary: {
    en: "This is the main borrower form for an SBA 7(a) small-business loan. It asks for your business details, ownership, and financials, and it commits owners of 20% or more to a personal guarantee and a background check. There's a one-time guaranty fee and a submission deadline, so finish it carefully and on time.",
    es: "Este es el formulario principal del prestatario para un préstamo SBA 7(a) para pequeñas empresas. Pide los datos de su negocio, la propiedad y las finanzas, y compromete a los dueños con 20% o más a una garantía personal y una verificación de antecedentes. Hay una tarifa de garantía única y una fecha límite, así que complételo con cuidado y a tiempo.",
  },
  pages: [
    { index: 0, image: PAGE0, width: PW, height: PH },
    { index: 1, image: PAGE1, width: PW, height: PH },
  ],
  requirements,
  topFlags: [
    { kind: "deadline", label: { en: "Submit by Jun 30, 2026", es: "Envíe antes del 30 de jun, 2026" }, date: "2026-06-30" },
    { kind: "fee", label: { en: "≈ $2,500 guaranty fee", es: "≈ $2,500 de tarifa de garantía" } },
    { kind: "background-check", label: { en: "Owners 20%+ background-checked", es: "Dueños 20%+ verificados" } },
    { kind: "legal-risk", label: { en: "Personal guarantee required", es: "Se requiere garantía personal" } },
  ],
};

// Canonical hero export. The backend modules + the eval harness target the SBA
// document by this name; `MOCK_DOC` stays as the generic fallback the API (Preston)
// already imports, so both names resolve to the one coherent SBA model.
export const MOCK_SBA: DocumentModel = MOCK_DOC;

// ==========================================================================
//  EXTRA DOC CLASSES — small fixtures proving the spine generalizes beyond
//  the SBA hero. Each surfaces a different RequirementType mix + topFlags so
//  the UI can be tested against other documents. Kept compact on purpose.
// ==========================================================================

// Bounding box (padded) of a set of field rects = a grouped fill-field spotlight.
function boxOf(rects: Rect[]): Rect {
  const page = rects[0].page;
  const minX = Math.min(...rects.map((r) => r.x));
  const minY = Math.min(...rects.map((r) => r.y));
  const maxX = Math.max(...rects.map((r) => r.x + r.w));
  const maxY = Math.max(...rects.map((r) => r.y + r.h));
  const pad = 0.012;
  return { page, x: Math.max(0, minX - pad), y: Math.max(0, minY - pad), w: Math.min(1, maxX - minX + pad * 2), h: Math.min(1, maxY - minY + pad * 2) };
}

// A simple one-page placeholder (title + subtitle) so the canvas has something to draw.
function plainPage(title: string, subtitle: string) {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">` +
    `<rect width="${PW}" height="${PH}" fill="#f8fafc"/>` +
    `<rect x="18" y="18" width="${PW - 36}" height="${PH - 36}" fill="#ffffff" stroke="#e2e8f0"/>` +
    `<text x="40" y="60" font-size="22" font-weight="700" fill="#0f172a" font-family="Arial, sans-serif">${esc(title)}</text>` +
    `<text x="40" y="88" font-size="13" fill="#64748b" font-family="Arial, sans-serif">${esc(subtitle)}</text>` +
    `</svg>`;
  return { index: 0, image: "data:image/svg+xml," + encodeURIComponent(svg), width: PW, height: PH };
}

// ---- Residential lease — deadlines, fees, a binding signature ----
const leaseNameRect: Rect = { page: 0, x: 0.06, y: 0.2, w: 0.5, h: 0.03 };
const leaseRentRect: Rect = { page: 0, x: 0.06, y: 0.27, w: 0.3, h: 0.03 };
export const MOCK_LEASE: DocumentModel = {
  id: "mock_lease",
  fileName: "Residential-Lease.pdf",
  docType: { en: "Residential lease agreement", es: "Contrato de arrendamiento de vivienda" },
  summary: {
    en: "This is a 12-month lease for a place to live. It asks for your name and the rent, a refundable security deposit, and your signature — which legally binds you to the full term. Read the deposit and end-of-lease rules before you sign.",
    es: "Este es un contrato de arrendamiento de 12 meses para una vivienda. Pide su nombre y la renta, un depósito de garantía reembolsable, y su firma, que lo compromete legalmente por todo el plazo. Lea las reglas del depósito y del fin del contrato antes de firmar.",
  },
  pages: [plainPage("Residential Lease Agreement", "12-month term · sign to accept")],
  requirements: [
    {
      id: "r_lease_party", order: 1, type: "fill-field", difficulty: "easy", status: "todo",
      title: { en: "Enter your name and the monthly rent", es: "Ingrese su nombre y la renta mensual" },
      guidance: { en: "Write your full legal name as the tenant and the monthly rent exactly as the lease states it.", es: "Escriba su nombre legal completo como inquilino y la renta mensual tal como aparece en el contrato." },
      flags: [],
      fields: [
        { id: "f_lease_name", name: "tenant_name", kind: "text", label: { en: "Tenant full name", es: "Nombre completo del inquilino" }, rect: leaseNameRect, value: null, required: true },
        { id: "f_lease_rent", name: "monthly_rent", kind: "number", label: { en: "Monthly rent", es: "Renta mensual" }, rect: leaseRentRect, value: null, required: true, placeholder: "$1,800" },
      ],
      spotlight: boxOf([leaseNameRect, leaseRentRect]),
    },
    {
      id: "r_lease_deposit", order: 2, type: "pay-fee", difficulty: "medium", status: "todo",
      title: { en: "Pay the security deposit", es: "Pague el depósito de garantía" },
      guidance: { en: "A refundable deposit is due before move-in. You should get it back when you leave if there's no damage — ask for the deposit terms in writing.", es: "Se debe pagar un depósito reembolsable antes de mudarse. Debería recuperarlo al irse si no hay daños — pida las condiciones del depósito por escrito." },
      flags: [{ kind: "fee", label: { en: "$1,800 refundable deposit", es: "$1,800 de depósito reembolsable" } }],
      fields: [], spotlight: null,
    },
    {
      id: "r_lease_income", order: 3, type: "gather-document", difficulty: "medium", status: "todo",
      title: { en: "Bring proof of income", es: "Traiga comprobante de ingresos" },
      guidance: { en: "Most landlords want recent pay stubs or a bank statement showing you can cover the rent. Have them ready as PDFs.", es: "La mayoría de los propietarios piden talones de pago recientes o un estado de cuenta que muestre que puede pagar la renta. Téngalos listos en PDF." },
      flags: [{ kind: "tip", label: { en: "Usually the last 2-3 pay stubs", es: "Normalmente los últimos 2-3 talones de pago" } }],
      fields: [], spotlight: null,
    },
    {
      id: "r_lease_sign", order: 4, type: "sign", difficulty: "medium", status: "todo",
      title: { en: "Sign the lease", es: "Firme el contrato" },
      guidance: { en: "Your signature locks you into the full 12 months — you owe rent for the whole term even if you move out early. Don't sign until the rent, dates, and deposit rules are correct.", es: "Su firma lo compromete por los 12 meses completos — debe la renta por todo el plazo aunque se mude antes. No firme hasta que la renta, las fechas y las reglas del depósito sean correctas." },
      flags: [
        { kind: "legal-risk", label: { en: "Binds you for the full 12 months", es: "Lo compromete por los 12 meses completos" } },
        { kind: "deadline", label: { en: "Sign by Jun 15, 2026", es: "Firme antes del 15 de jun, 2026" }, date: "2026-06-15" },
      ],
      fields: [], spotlight: null,
    },
  ],
  topFlags: [
    { kind: "deadline", label: { en: "Sign by Jun 15, 2026", es: "Firme antes del 15 de jun, 2026" }, date: "2026-06-15" },
    { kind: "fee", label: { en: "$1,800 deposit due at signing", es: "$1,800 de depósito al firmar" } },
    { kind: "legal-risk", label: { en: "12-month commitment", es: "Compromiso de 12 meses" } },
  ],
};

// ---- CalFresh (food benefits) renewal — gather prerequisites + a hard deadline ----
const benefitsSizeRect: Rect = { page: 0, x: 0.06, y: 0.22, w: 0.18, h: 0.03 };
const benefitsIncomeRect: Rect = { page: 0, x: 0.3, y: 0.22, w: 0.28, h: 0.03 };
export const MOCK_BENEFITS: DocumentModel = {
  id: "mock_benefits",
  fileName: "CalFresh-Renewal.pdf",
  docType: { en: "CalFresh (food benefits) renewal", es: "Renovación de CalFresh (beneficios de alimentos)" },
  summary: {
    en: "This form renews your monthly food benefits. You must report your household size and income, send proof, and finish a quick phone interview. If you miss the deadline your benefits stop, so don't wait.",
    es: "Este formulario renueva sus beneficios mensuales de alimentos. Debe informar el tamaño de su hogar y sus ingresos, enviar comprobantes y completar una breve entrevista telefónica. Si pierde la fecha límite, sus beneficios se detienen, así que no espere.",
  },
  pages: [plainPage("CalFresh Renewal", "Report income · interview required")],
  requirements: [
    {
      id: "r_ben_stubs", order: 1, type: "gather-document", difficulty: "medium", status: "todo",
      title: { en: "Gather your last 30 days of pay stubs", es: "Reúna sus talones de pago de los últimos 30 días" },
      guidance: { en: "You'll need proof of everything the household earned in the last month. If you're paid in cash, a signed note from your employer can work — ask your worker.", es: "Necesitará comprobante de todo lo que ganó el hogar el último mes. Si le pagan en efectivo, una nota firmada de su empleador puede servir — pregunte a su trabajador social." },
      flags: [{ kind: "tip", label: { en: "Cash income still counts — report it", es: "El ingreso en efectivo también cuenta — repórtelo" } }],
      fields: [], spotlight: null,
    },
    {
      id: "r_ben_residence", order: 2, type: "gather-document", difficulty: "easy", status: "todo",
      title: { en: "Bring proof of where you live", es: "Traiga comprobante de dónde vive" },
      guidance: { en: "A utility bill, lease, or piece of mail with your address is usually enough.", es: "Una factura de servicios, un contrato de arrendamiento o una carta con su dirección suele ser suficiente." },
      flags: [], fields: [], spotlight: null,
    },
    {
      id: "r_ben_household", order: 3, type: "fill-field", difficulty: "medium", status: "todo",
      title: { en: "Report your household size and income", es: "Informe el tamaño de su hogar y sus ingresos" },
      guidance: { en: "Count everyone who buys and cooks food together. Put the total monthly income before taxes — be exact, it sets your benefit amount.", es: "Cuente a todos los que compran y cocinan los alimentos juntos. Ponga el ingreso mensual total antes de impuestos — sea exacto, eso determina el monto de su beneficio." },
      flags: [],
      fields: [
        { id: "f_ben_size", name: "household_size", kind: "number", label: { en: "People in household", es: "Personas en el hogar" }, rect: benefitsSizeRect, value: null, required: true },
        { id: "f_ben_income", name: "monthly_income", kind: "number", label: { en: "Monthly income (before taxes)", es: "Ingreso mensual (antes de impuestos)" }, rect: benefitsIncomeRect, value: null, required: true },
      ],
      spotlight: boxOf([benefitsSizeRect, benefitsIncomeRect]),
    },
    {
      id: "r_ben_interview", order: 4, type: "external-action", difficulty: "hard", status: "todo",
      title: { en: "Complete your phone interview", es: "Complete su entrevista telefónica" },
      guidance: { en: "The county will call you to confirm your answers. Watch for the call and answer unknown numbers around your appointment window — missing it can delay or stop your benefits.", es: "El condado lo llamará para confirmar sus respuestas. Esté pendiente de la llamada y conteste números desconocidos cerca de su cita — perderla puede retrasar o detener sus beneficios." },
      flags: [{ kind: "tip", label: { en: "They call you — keep your phone close", es: "Ellos lo llaman — tenga su teléfono cerca" } }],
      fields: [], spotlight: null,
    },
  ],
  topFlags: [
    { kind: "deadline", label: { en: "Renew by Jun 20, 2026 or benefits stop", es: "Renueve antes del 20 de jun, 2026 o se detienen los beneficios" }, date: "2026-06-20" },
    { kind: "tip", label: { en: "A phone interview is required", es: "Se requiere una entrevista telefónica" } },
  ],
};

// ---- USCIS N-400 (citizenship) — external background actions + fee + perjury signature ----
const uscisNameRect: Rect = { page: 0, x: 0.06, y: 0.2, w: 0.5, h: 0.03 };
const uscisANumRect: Rect = { page: 0, x: 0.06, y: 0.27, w: 0.28, h: 0.03 };
export const MOCK_USCIS: DocumentModel = {
  id: "mock_uscis",
  fileName: "USCIS-N-400.pdf",
  docType: { en: "USCIS Form N-400 (citizenship application)", es: "Formulario N-400 de USCIS (solicitud de ciudadanía)" },
  summary: {
    en: "This is the application to become a U.S. citizen. It asks for your legal name and A-Number, a filing fee, a fingerprint (biometrics) appointment, and your signature under penalty of perjury. Everything you write must be true and match your records.",
    es: "Esta es la solicitud para hacerse ciudadano de los EE. UU. Pide su nombre legal y su número A, una tarifa de presentación, una cita de huellas (biométricos) y su firma bajo pena de perjurio. Todo lo que escriba debe ser verdadero y coincidir con sus registros.",
  },
  pages: [plainPage("USCIS Form N-400", "Application for Naturalization")],
  requirements: [
    {
      id: "r_uscis_docs", order: 1, type: "gather-document", difficulty: "medium", status: "todo",
      title: { en: "Gather your green card and travel records", es: "Reúna su tarjeta verde y registros de viajes" },
      guidance: { en: "Have your permanent resident card and a list of every trip outside the U.S. (dates and length). Accuracy here matters for eligibility.", es: "Tenga su tarjeta de residente permanente y una lista de cada viaje fuera de los EE. UU. (fechas y duración). La exactitud aquí importa para la elegibilidad." },
      flags: [], fields: [], spotlight: null,
    },
    {
      id: "r_uscis_identity", order: 2, type: "fill-field", difficulty: "medium", status: "todo",
      title: { en: "Enter your legal name and A-Number", es: "Ingrese su nombre legal y número A" },
      guidance: { en: "Write your name exactly as it appears on your green card, and your 9-digit A-Number (starts with 'A'). They must match your records.", es: "Escriba su nombre exactamente como aparece en su tarjeta verde, y su número A de 9 dígitos (empieza con 'A'). Deben coincidir con sus registros." },
      flags: [],
      fields: [
        { id: "f_uscis_name", name: "applicant_name", kind: "text", label: { en: "Full legal name", es: "Nombre legal completo" }, rect: uscisNameRect, value: null, required: true },
        { id: "f_uscis_anum", name: "a_number", kind: "text", label: { en: "A-Number", es: "Número A" }, rect: uscisANumRect, value: null, required: true, placeholder: "A123456789" },
      ],
      spotlight: boxOf([uscisNameRect, uscisANumRect]),
    },
    {
      id: "r_uscis_fee", order: 3, type: "pay-fee", difficulty: "hard", status: "todo",
      title: { en: "Pay the filing fee", es: "Pague la tarifa de presentación" },
      guidance: { en: "There's a filing fee for N-400. A fee waiver may be available if your income is low — ask before you pay, and never send cash by mail.", es: "Hay una tarifa de presentación para el N-400. Puede haber una exención de tarifa si su ingreso es bajo — pregunte antes de pagar, y nunca envíe efectivo por correo." },
      flags: [{ kind: "fee", label: { en: "$760 filing fee (waiver may apply)", es: "$760 de tarifa (puede aplicar exención)" } }],
      fields: [], spotlight: null,
    },
    {
      id: "r_uscis_bio", order: 4, type: "external-action", difficulty: "hard", status: "todo",
      title: { en: "Attend your biometrics appointment", es: "Asista a su cita de biométricos" },
      guidance: { en: "USCIS will mail you a date to take your fingerprints and photo for a background check. Bring the notice and a photo ID, and don't miss it.", es: "USCIS le enviará por correo una fecha para tomar sus huellas y foto para una verificación de antecedentes. Lleve el aviso y una identificación con foto, y no falte." },
      flags: [{ kind: "background-check", label: { en: "Fingerprints + background check", es: "Huellas + verificación de antecedentes" } }],
      fields: [], spotlight: null,
    },
    {
      id: "r_uscis_sign", order: 5, type: "sign", difficulty: "medium", status: "todo",
      title: { en: "Sign under penalty of perjury", es: "Firme bajo pena de perjurio" },
      guidance: { en: "Your signature swears everything in the form is true. A false answer can cost you your application or your status — review it carefully before signing.", es: "Su firma jura que todo en el formulario es verdadero. Una respuesta falsa puede costarle su solicitud o su estatus — revíselo con cuidado antes de firmar." },
      flags: [{ kind: "legal-risk", label: { en: "Signed under penalty of perjury", es: "Firmado bajo pena de perjurio" } }],
      fields: [], spotlight: null,
    },
  ],
  topFlags: [
    { kind: "fee", label: { en: "$760 filing fee", es: "$760 de tarifa de presentación" } },
    { kind: "background-check", label: { en: "Biometrics + background check", es: "Biométricos + verificación de antecedentes" } },
    { kind: "legal-risk", label: { en: "Signed under penalty of perjury", es: "Firmado bajo pena de perjurio" } },
  ],
};

// Convenience map so the UI and the eval can iterate every doc class.
export const MOCK_VARIANTS: Record<string, DocumentModel> = {
  sba: MOCK_SBA,
  lease: MOCK_LEASE,
  benefits: MOCK_BENEFITS,
  uscis: MOCK_USCIS,
};
