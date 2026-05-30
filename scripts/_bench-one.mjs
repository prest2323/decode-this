#!/usr/bin/env node
// BENCHMARK WORKER — owned by Michael. Runs ONE (model × sample) extraction
// in-process (no dev server) so the parent benchmark.mjs can compare models on a
// clean, fresh module load. Prints a single JSON line of metrics + latency.
//
//   node --import ./scripts/_register-alias.mjs scripts/_bench-one.mjs <model> <samplePath>
//
// Loads ONLY the API key from .env.local (never printed) and overrides
// GEMINI_MODEL before importing the analyzer, so each child uses the right model.
import { readFileSync } from "node:fs";
import path from "node:path";

const [model, samplePath] = process.argv.slice(2);

// Pull the key from .env.local without echoing it; honor a pre-set env too.
try {
  const env = readFileSync(".env.local", "utf8");
  for (const line of env.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)$/);
    if (!m) continue;
    const [, k, rawV] = m;
    const v = rawV.trim().replace(/^["']|["']$/g, "");
    if ((k === "GEMINI_API_KEY" || k === "ANTHROPIC_API_KEY") && !process.env[k]) process.env[k] = v;
  }
} catch {
  /* no .env.local — provider() will be mock and we'll report that */
}
process.env.GEMINI_MODEL = model; // override per child

const { analyzeDocument, extractAcroFields } = await import("@/lib/extract");

const MIME = { ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".txt": "text/plain" };
const ADDR = /addr|street|\bcity\b|\bstate\b|\bzip\b|postal|calle|ciudad|estado|direcci/i;
const PREREQ = new Set(["gather-document", "external-action"]);
const ONPAGE = new Set(["fill-field", "pay-fee", "sign"]);
const biOk = (b) => !!b && typeof b?.es === "string" && b.es.trim().length > 0 && typeof b?.en === "string";

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
function orderOk(reqs) {
  let onpage = false;
  for (const r of [...reqs].sort((a, b) => a.order - b.order)) {
    if (ONPAGE.has(r.type)) onpage = true;
    else if (PREREQ.has(r.type) && onpage) return false;
  }
  return true;
}

async function main() {
  const ext = path.extname(samplePath).toLowerCase();
  const isText = ext === ".txt";
  const buf = readFileSync(samplePath);
  const file = isText ? buf.toString("utf8") : `data:${MIME[ext]};base64,${buf.toString("base64")}`;
  const mime = MIME[ext];

  // For the PDF, learn the real AcroForm names so we can score the rect-join.
  let acroNames = new Set();
  if (!isText && mime === "application/pdf") {
    try {
      const acro = await extractAcroFields(buf);
      acroNames = new Set(acro.map((f) => f.name));
    } catch {
      /* ignore */
    }
  }

  const t0 = Date.now();
  let doc, err;
  try {
    doc = await analyzeDocument({ fileName: path.basename(samplePath), file, mime });
  } catch (e) {
    err = e?.message || String(e);
  }
  const ms = Date.now() - t0;

  if (err || !doc) {
    console.log(JSON.stringify({ model, sample: path.basename(samplePath), ok: false, err, ms }));
    return;
  }

  const reqs = doc.requirements || [];
  const addrReqIds = new Set();
  let fieldsTotal = 0;
  let fieldsRealName = 0;
  for (const r of reqs) {
    for (const f of r.fields || []) {
      fieldsTotal++;
      if (acroNames.has(f.name)) fieldsRealName++;
      if (ADDR.test(`${f.name} ${f.label?.en || ""} ${f.label?.es || ""}`)) addrReqIds.add(r.id);
    }
  }
  const flagKinds = new Set([...(doc.topFlags || []), ...reqs.flatMap((r) => r.flags || [])].map((f) => f.kind));
  console.log(
    JSON.stringify({
      model,
      sample: path.basename(samplePath),
      ok: true,
      isMock: doc.id === "mock_sba_7a",
      ms,
      requirements: reqs.length,
      flags: reqs.reduce((n, r) => n + (r.flags?.length || 0), 0) + (doc.topFlags?.length || 0),
      grouping_ok: addrReqIds.size <= 1,
      bilingual_ok: bilingualOk(doc),
      order_ok: orderOk(reqs),
      acro_match: acroNames.size ? `${fieldsRealName}/${fieldsTotal}` : "n/a",
      types: [...new Set(reqs.map((r) => r.type))].join("/"),
      flag_kinds: [...flagKinds].join("/"),
    }),
  );
}

main().catch((e) => {
  console.log(JSON.stringify({ model, sample: path.basename(samplePath || ""), ok: false, err: e?.message || String(e) }));
});
