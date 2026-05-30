#!/usr/bin/env node
// OFFLINE SELF-TEST — owned by Michael. Unit-tests the pure backend functions
// that the live dev server can't exercise directly (export byte output, the
// grounded mock chat, the AcroForm coordinate join, the grouping/order pass).
// Runs with NO API key, so provider() === "mock" — fully offline, deterministic.
//
//   node --import ./scripts/_register-alias.mjs scripts/selftest.mjs
//   (or: npm run selftest)
//
// The alias hook lets us import the real lib/*.ts modules unchanged; Node 26
// strips the types natively. This is the regression net for tasks 7/8/12.
import { PDFDocument } from "pdf-lib";
import { MOCK_DOC, MOCK_VARIANTS } from "@/lib/mock";
import { buildExport } from "@/lib/export";
import { chatAnswer } from "@/lib/chat";
import { extractAcroFields, attachRealRects, groupAndOrder } from "@/lib/extract";
import { normalizeDoc } from "@/lib/ai";

let pass = 0;
let fail = 0;
const fails = [];
function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    fails.push(name);
    console.log(`  ✗ ${name}  ${detail}`);
  }
}
function section(t) {
  console.log(`\n${t}`);
}

// A deep clone with a couple of fields filled, so export reflects real values.
function filledMock() {
  const d = JSON.parse(JSON.stringify(MOCK_DOC));
  for (const r of d.requirements) {
    for (const f of r.fields) {
      if (f.kind === "checkbox") f.value = true;
      else if (f.name === "business_legal_name") f.value = "Kern Valley Tacos LLC";
      else if (f.name === "addr_city") f.value = "Bakersfield";
    }
  }
  return d;
}

async function main() {
  // ---------------- EXPORT ----------------
  section("export.ts — buildExport");
  const d = filledMock();

  const json = await buildExport(d, "json");
  const parsed = JSON.parse(json.data);
  check("json is valid + round-trips", parsed.requirements.length === d.requirements.length);
  check("json mime + filename", json.mime === "application/json" && json.filename.endsWith(".json"));

  const csv = await buildExport(d, "csv");
  const lines = csv.data.split("\n");
  const fieldCount = d.requirements.reduce((n, r) => n + r.fields.length, 0);
  check("csv has header + one row per field", lines.length === fieldCount + 1, `${lines.length} vs ${fieldCount + 1}`);
  check("csv carries a filled value", csv.data.includes("Bakersfield"));
  check("csv checkbox renders Yes", csv.data.includes("Yes"));

  const pdf = await buildExport(d, "pdf");
  const bytes = pdf.data;
  const head = Buffer.from(bytes.slice(0, 5)).toString("latin1");
  check("pdf starts with %PDF", head === "%PDF-", head);
  check("pdf is non-trivial size", bytes.length > 800, `${bytes.length} bytes`);
  // The generated PDF must be a loadable, valid document.
  const reloaded = await PDFDocument.load(bytes);
  check("pdf reloads + has >=1 page", reloaded.getPageCount() >= 1);

  let threw = "";
  try {
    await buildExport(d, "docx");
  } catch (e) {
    threw = e.message;
  }
  check("docx throws a friendly stub", threw === "docx-coming-soon", threw);

  // ---------------- CHAT (grounded mock) ----------------
  section("chat.ts — grounded mock (no key)");
  const pg = await chatAnswer({ question: "what is a personal guarantee?", lang: "en", doc: MOCK_DOC });
  check("personal-guarantee answer is grounded", /personal guarantee/i.test(pg.answer));
  check("personal-guarantee cites the legal-risk step", (pg.citedRequirementIds || []).includes("r_ownership"));

  const fee = await chatAnswer({ question: "how much does it cost?", lang: "en", doc: MOCK_DOC });
  check("fee answer mentions the guaranty fee", /guaranty fee/i.test(fee.answer) && /2,500/.test(fee.answer));

  const dl = await chatAnswer({ question: "¿cuándo vence?", lang: "es", doc: MOCK_DOC });
  check("deadline answer (es) returns Spanish + date", /fecha límite/i.test(dl.answer) && /2026/.test(dl.answer));

  const act = await chatAnswer({ question: "help", lang: "en", doc: MOCK_DOC, activeRequirementId: "r_address" });
  check("active-step fallback cites the active req", (act.citedRequirementIds || []).includes("r_address"));

  // ---------------- AcroForm coordinate extraction (task 2) ----------------
  section("extract.ts — extractAcroFields (real widget rects)");
  // Build a known-geometry AcroForm PDF in-memory: a name box + an address row.
  const testPdf = await PDFDocument.create();
  const page = testPdf.addPage([600, 800]); // w=600, h=800
  const form = testPdf.getForm();
  // pdf-lib origin is BOTTOM-left. A box at y=700 (from bottom), h=20 → top-left y≈ (800-720)/800=0.1
  const mk = (name, x, y, w, h) => {
    const tf = form.createTextField(name);
    tf.addToPage(page, { x, y, width: w, height: h, borderWidth: 1 });
  };
  mk("full_name", 60, 700, 300, 20); // top-left: x=0.1, y=(800-720)/800=0.1, w=0.5, h=0.025
  mk("addr_street", 60, 640, 360, 20);
  mk("addr_city", 60, 600, 180, 20);
  mk("addr_state", 260, 600, 60, 20);
  mk("addr_zip", 340, 600, 120, 20);
  const testBytes = await testPdf.save();
  const acro = await extractAcroFields(testBytes);
  check("found all 5 AcroForm fields", acro.length === 5, `${acro.length}`);
  const fn = acro.find((f) => f.name === "full_name");
  check(
    "full_name rect normalized top-left is correct",
    fn && near(fn.rect.x, 0.1) && near(fn.rect.y, 0.1) && near(fn.rect.w, 0.5) && near(fn.rect.h, 0.025),
    JSON.stringify(fn?.rect),
  );
  check("all rects are within [0..1]", acro.every((f) => inRange(f.rect)));
  check("kind inferred as text", acro.every((f) => f.kind === "text"));

  // attachRealRects: a model-style doc whose field names match the AcroForm,
  // but with WRONG (placeholder) rects, should get the real geometry stamped on.
  section("extract.ts — attachRealRects (name join)");
  const modelDoc = normalizeDoc({
    docType: { en: "Test form", es: "Formulario" },
    summary: { en: "a. b. c.", es: "a. b. c." },
    requirements: [
      {
        id: "r_name", order: 1, type: "fill-field", difficulty: "easy",
        title: { en: "Name", es: "Nombre" }, guidance: { en: "x", es: "x" }, flags: [],
        fields: [{ id: "f1", name: "full_name", kind: "text", label: { en: "Name", es: "Nombre" }, rect: { page: 0, x: 0.9, y: 0.9, w: 0.05, h: 0.05 }, required: true }],
      },
      {
        id: "r_addr", order: 2, type: "fill-field", difficulty: "easy",
        title: { en: "Address", es: "Dirección" }, guidance: { en: "x", es: "x" }, flags: [],
        fields: ["addr_street", "addr_city", "addr_state", "addr_zip"].map((n, i) => ({
          id: `fa${i}`, name: n, kind: "text", label: { en: n, es: n }, rect: { page: 0, x: 0.5, y: 0.5, w: 0.01, h: 0.01 }, required: true,
        })),
      },
    ],
  });
  const stamped = attachRealRects(modelDoc, acro);
  const nameReq = stamped.requirements.find((r) => r.id === "r_name");
  check("attachRealRects stamps the real name rect", near(nameReq.fields[0].rect.x, 0.1) && near(nameReq.fields[0].rect.y, 0.1));
  const addrReq = stamped.requirements.find((r) => r.id === "r_addr");
  check("attachRealRects re-derives the grouped address spotlight from real rects", addrReq.spotlight && addrReq.spotlight.w > 0.4);

  // ---------------- groupAndOrder (task 3 / queue 5) ----------------
  section("extract.ts — groupAndOrder");
  // Two ADJACENT address fill-fields the model failed to merge + an out-of-order prereq.
  const messy = normalizeDoc({
    docType: { en: "x", es: "x" }, summary: { en: "a. b. c.", es: "a. b. c." },
    requirements: [
      { id: "a", order: 1, type: "fill-field", difficulty: "easy", title: { en: "Street", es: "Calle" }, guidance: { en: "x", es: "x" }, flags: [], fields: [{ id: "s", name: "addr_street", kind: "text", label: { en: "Street", es: "Calle" }, rect: { page: 0, x: 0.05, y: 0.30, w: 0.6, h: 0.03 }, required: true }] },
      { id: "b", order: 2, type: "fill-field", difficulty: "easy", title: { en: "City/State/Zip", es: "Ciudad" }, guidance: { en: "x", es: "x" }, flags: [], fields: [{ id: "c", name: "addr_city", kind: "text", label: { en: "City", es: "Ciudad" }, rect: { page: 0, x: 0.05, y: 0.34, w: 0.3, h: 0.03 }, required: true }] },
      { id: "g", order: 3, type: "gather-document", difficulty: "easy", title: { en: "Bring tax return", es: "Traiga" }, guidance: { en: "x", es: "x" }, flags: [], fields: [] },
    ],
  });
  const ordered = groupAndOrder(messy.requirements);
  const addrGroups = ordered.filter((r) => r.fields.some((f) => /addr|street|city/i.test(f.name)));
  check("merges the two adjacent address fill-fields into ONE", addrGroups.length === 1, `${addrGroups.length} groups`);
  check("the prerequisite (gather) is ordered before the on-page fill", ordered[0].type === "gather-document");
  check("order is reassigned 1..n contiguous", ordered.every((r, i) => r.order === i + 1));
  check("exactly one active step", ordered.filter((r) => r.status === "active").length === 1);

  // ---------------- bilingual integrity (task 7) ----------------
  section("normalizeDoc — bilingual fill-on-miss");
  const enOnly = normalizeDoc({
    docType: { en: "English only" }, summary: { en: "a. b. c." },
    requirements: [{ id: "r", order: 1, type: "sign", difficulty: "easy", title: { en: "Sign here" }, guidance: { en: "Do it" }, flags: [{ kind: "tip", label: { en: "tip" } }] }],
  });
  check("es filled from en on docType", enOnly.docType.es === "English only");
  check("es filled from en on requirement title", enOnly.requirements[0].title.es === "Sign here");
  check("es filled from en on flag label", enOnly.requirements[0].flags[0].label.es === "tip");

  // ---------------- every mock variant is well-formed ----------------
  section("mock.ts — every variant is contract-valid");
  for (const [key, doc] of Object.entries(MOCK_VARIANTS)) {
    const allBilingual = checkBilingual(doc);
    const allRects = doc.requirements.every((r) => r.fields.every((f) => inRange(f.rect)));
    check(`${key}: bilingual complete + rects in range + has requirements`, allBilingual && allRects && doc.requirements.length > 0);
  }

  console.log(`\n${fail === 0 ? "✅" : "❌"}  ${pass} passed, ${fail} failed`);
  if (fail) {
    console.log("Failed:", fails.join("; "));
    process.exitCode = 1;
  }
}

function near(a, b, eps = 0.01) {
  return typeof a === "number" && Math.abs(a - b) <= eps;
}
function inRange(r) {
  return [r.x, r.y, r.w, r.h].every((n) => n >= 0 && n <= 1) && r.page >= 0;
}
function checkBilingual(doc) {
  const ok = (b) => b && typeof b.en === "string" && typeof b.es === "string" && b.es.length > 0;
  if (!ok(doc.docType) || !ok(doc.summary)) return false;
  for (const f of doc.topFlags) if (!ok(f.label)) return false;
  for (const r of doc.requirements) {
    if (!ok(r.title) || !ok(r.guidance)) return false;
    for (const fl of r.flags) if (!ok(fl.label)) return false;
    for (const fd of r.fields) if (!ok(fd.label)) return false;
  }
  return true;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
