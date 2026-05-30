#!/usr/bin/env node
// EVAL HARNESS — owned by Michael. Regression net for extraction quality.
// POSTs each sample doc in scripts/samples/ to /api/analyze and prints a table:
//   doc, mode, requirements, flags, fill_groups, grouping_ok, bilingual_ok,
//   order_ok, types, latency_ms
//
//   npm run dev          # one terminal (add GEMINI_API_KEY to .env.local for live)
//   node scripts/eval.mjs   (or: npm run eval)
//   node scripts/make-samples.mjs   # (re)generate the sample set first
//
// Pure Node (fetch + fs), zero deps. Two modes per row, auto-detected:
//   • mock  — no key, so /api/analyze returns the SBA mock for every sample; we
//             assert the mock is well-formed (grouping + bilingual hold).
//   • live  — a real model reply; we ALSO check per-class expectations.
// Exit 1 on any HTTP failure, grouping drift, bilingual gap, or a live row that
// misses its class expectations — so drift is caught before the judges see it.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = process.env.EVAL_URL || "http://localhost:3000";
const MODEL_LABEL = process.env.MODEL_LABEL || ""; // optional run label (e.g. the model)
const SAMPLES_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "samples");

const MIME = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".txt": "text/plain",
};

// Address-ish field detector (EN + ES), used for the grouping check.
const ADDR = /addr|street|\bcity\b|\bstate\b|\bzip\b|postal|calle|ciudad|estado|direcci/i;
const MOCK_SBA_ID = "mock_sba_7a"; // the analyzer's fallback id ⇒ "mock mode"
const PREREQ = new Set(["gather-document", "external-action"]);
const ONPAGE = new Set(["fill-field", "pay-fee", "sign"]);

// Per-class LIVE expectations: a key RequirementType that must appear + a key
// flag kind that must surface. Lenient on purpose — the model phrasing varies.
const EXPECT = {
  "sba-like-acroform.pdf": { type: "fill-field", addrGroup: true },
  "lease-agreement.txt": { type: "sign", flag: "deadline" },
  "medical-bill.txt": { type: "pay-fee", flag: "fee" },
  // filing a court response is reasonably a "sign" OR an "external-action"; the
  // signal that matters is the respond-by deadline + the default-judgment risk.
  "court-summons.txt": { anyType: ["sign", "external-action"], anyFlagOk: ["deadline", "legal-risk"] },
};

async function loadSamples() {
  let files = [];
  try {
    files = (await readdir(SAMPLES_DIR)).filter((f) => MIME[path.extname(f).toLowerCase()]);
  } catch {
    /* no samples dir */
  }
  if (!files.length) {
    return [{ name: "(no samples — analyzer returns the SBA mock)", fileName: "sample.pdf", file: "data:application/pdf;base64,JVBERi0=", mime: "application/pdf" }];
  }
  const out = [];
  for (const f of files.sort()) {
    const ext = path.extname(f).toLowerCase();
    const buf = await readFile(path.join(SAMPLES_DIR, f));
    const isText = ext === ".txt";
    out.push({
      name: f,
      fileName: f,
      file: isText ? buf.toString("utf8") : `data:${MIME[ext]};base64,${buf.toString("base64")}`,
      mime: MIME[ext],
    });
  }
  return out;
}

async function analyze(sample) {
  const t0 = performance.now();
  const res = await fetch(`${BASE}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: sample.fileName, file: sample.file, mime: sample.mime }),
  });
  const json = await res.json();
  return { httpOk: res.ok, json, ms: Math.round(performance.now() - t0) };
}

const biOk = (b) => !!b && typeof b.es === "string" && b.es.trim().length > 0 && typeof b.en === "string";

/** Every user-facing Record<Lang,string> in the doc has a non-empty es. */
function bilingualOk(doc) {
  if (!biOk(doc.docType) || !biOk(doc.summary)) return false;
  for (const f of doc.topFlags || []) if (!biOk(f.label)) return false;
  for (const r of doc.requirements || []) {
    if (!biOk(r.title) || !biOk(r.guidance)) return false;
    for (const fl of r.flags || []) if (!biOk(fl.label)) return false;
    for (const fd of r.fields || []) if (!biOk(fd.label)) return false;
  }
  return true;
}

/** Prerequisites (gather/external) should not appear AFTER an on-page step. */
function orderOk(reqs) {
  let sawOnPage = false;
  for (const r of [...reqs].sort((a, b) => a.order - b.order)) {
    if (ONPAGE.has(r.type)) sawOnPage = true;
    else if (PREREQ.has(r.type) && sawOnPage) return false;
  }
  return true;
}

function metrics(doc) {
  const reqs = Array.isArray(doc.requirements) ? doc.requirements : [];
  const fillGroups = reqs.filter((r) => r.type === "fill-field").length;
  const flags = reqs.reduce((n, r) => n + (r.flags?.length || 0), 0) + (doc.topFlags?.length || 0);
  // grouping_ok: every address field lives in ONE requirement
  const addrReqIds = new Set();
  for (const r of reqs) {
    for (const f of r.fields || []) {
      if (ADDR.test(`${f.name} ${f.label?.en || ""} ${f.label?.es || ""}`)) addrReqIds.add(r.id);
    }
  }
  const types = [...new Set(reqs.map((r) => r.type))];
  const flagKinds = new Set([...(doc.topFlags || []), ...reqs.flatMap((r) => r.flags || [])].map((f) => f.kind));
  return {
    requirements: reqs.length,
    flags,
    fill_groups: fillGroups,
    grouping_ok: addrReqIds.size <= 1,
    bilingual_ok: bilingualOk(doc),
    order_ok: orderOk(reqs),
    _types: new Set(types),
    _flagKinds: flagKinds,
    types: types.join("/"),
  };
}

/** Live-mode class expectations → list of failures (empty = pass). */
function expectationFailures(name, m) {
  const exp = EXPECT[name];
  if (!exp) return [];
  const fails = [];
  if (exp.type && !m._types.has(exp.type)) fails.push(`missing type ${exp.type}`);
  if (exp.anyType && !exp.anyType.some((t) => m._types.has(t))) fails.push(`missing any of type ${exp.anyType.join("|")}`);
  // Decoupled from exp.flag so an anyFlagOk-only entry (court-summons) is actually
  // enforced — previously the whole check hid behind `if (exp.flag && …)`.
  const flagReq = exp.anyFlagOk ?? (exp.flag ? [exp.flag] : null);
  if (flagReq && !flagReq.some((k) => m._flagKinds.has(k))) fails.push(`missing flag ${flagReq.join("|")}`);
  if (exp.addrGroup && !m.grouping_ok) fails.push("address not grouped");
  return fails;
}

async function main() {
  const samples = await loadSamples();
  console.log(`Eval → ${BASE}/api/analyze${MODEL_LABEL ? `   [${MODEL_LABEL}]` : ""}   (${samples.length} sample(s))\n`);
  const rows = [];
  const problems = [];
  for (const s of samples) {
    try {
      const { httpOk, json, ms } = await analyze(s);
      if (!httpOk || !json?.ok) {
        rows.push({ doc: s.name, error: json?.error || `HTTP ${httpOk}` });
        problems.push(`${s.name}: ${json?.error || "http error"}`);
        continue;
      }
      const doc = json.result;
      const mode = doc.id === MOCK_SBA_ID ? "mock" : "live";
      const m = metrics(doc);
      const row = {
        doc: s.name,
        mode,
        requirements: m.requirements,
        flags: m.flags,
        fill_groups: m.fill_groups,
        grouping_ok: m.grouping_ok,
        bilingual_ok: m.bilingual_ok,
        order_ok: m.order_ok,
        types: m.types,
        latency_ms: ms,
      };
      rows.push(row);
      // Universal gates (both modes).
      if (!m.grouping_ok) problems.push(`${s.name}: address grouping drift`);
      if (!m.bilingual_ok) problems.push(`${s.name}: bilingual gap (empty es somewhere)`);
      // Class expectations only make sense on a real reply.
      if (mode === "live") {
        for (const f of expectationFailures(s.name, m)) problems.push(`${s.name}: ${f}`);
      }
    } catch (e) {
      const hint = String(e?.cause?.code || e?.code) === "ECONNREFUSED" ? "dev server not running? (npm run dev)" : e.message;
      rows.push({ doc: s.name, error: hint });
      problems.push(`${s.name}: ${hint}`);
    }
  }
  console.table(rows);
  if (problems.length) {
    console.log(`\n⚠ ${problems.length} issue(s):`);
    for (const p of problems) console.log(`  - ${p}`);
    process.exitCode = 1;
  } else {
    console.log("\n✓ all samples analyzed; grouping + bilingual held; live expectations met.");
  }
}

main();
