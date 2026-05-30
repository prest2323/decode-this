#!/usr/bin/env node
// EVAL HARNESS — owned by Michael. Regression net for extraction quality.
// POSTs each sample doc in scripts/samples/ to /api/analyze and prints a table:
//   doc, requirements_found, flags_found, fill_field_groups, grouping_ok, latency_ms
// grouping_ok = did the address (street+city+state+zip) collapse into ONE
// fill-field requirement? Run after every prompt change to catch drift.
//
//   npm run dev          # in one terminal (add GEMINI_API_KEY to .env.local for live)
//   node scripts/eval.mjs   (or: npm run eval)
//
// Pure Node (fetch + fs), zero deps. With no key, /api/analyze returns the SBA
// mock, so this still exercises the harness + the grouping check offline.
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const BASE = process.env.EVAL_URL || "http://localhost:3000";
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
  return {
    requirements_found: reqs.length,
    flags_found: flags,
    fill_field_groups: fillGroups,
    grouping_ok: addrReqIds.size <= 1,
  };
}

async function main() {
  const samples = await loadSamples();
  console.log(`Eval → ${BASE}/api/analyze   (${samples.length} sample(s))\n`);
  const rows = [];
  for (const s of samples) {
    try {
      const { httpOk, json, ms } = await analyze(s);
      if (!httpOk || !json?.ok) {
        rows.push({ doc: s.name, error: json?.error || `HTTP ${httpOk}` });
        continue;
      }
      rows.push({ doc: s.name, ...metrics(json.result), latency_ms: ms });
    } catch (e) {
      const hint = String(e?.cause?.code || e?.code) === "ECONNREFUSED" ? "dev server not running? (npm run dev)" : e.message;
      rows.push({ doc: s.name, error: hint });
    }
  }
  console.table(rows);
  const failed = rows.filter((r) => r.error || r.grouping_ok === false);
  if (failed.length) {
    console.log(`\n⚠ ${failed.length} sample(s) failed or had grouping drift.`);
    process.exitCode = 1;
  } else {
    console.log("\n✓ all samples analyzed; address grouping held.");
  }
}

main();
