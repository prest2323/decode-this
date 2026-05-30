#!/usr/bin/env node
// MODEL BENCHMARK — owned by Michael (agenda #10). Runs the sample set against
// several models IN-PROCESS (one fresh child per model × sample, no dev server)
// and prints accuracy + latency so we can pick the fastest-that-stays-accurate
// as the demo default and justify it to judges.
//
//   node scripts/benchmark.mjs                         # gemini flash vs pro
//   node scripts/benchmark.mjs gemini-2.5-flash gemini-2.5-pro
//
// Needs GEMINI_API_KEY in .env.local (each child loads it). With no key every
// child returns the SBA mock (isMock=true) — the harness still runs, it just
// can't differentiate models. "accuracy" = how many of {grouping, bilingual,
// order} held, averaged across samples (0..1). acro_match = real-name join rate
// on the AcroForm PDF (the coordinate feature) — higher is better.
//
// ── BENCHMARK STATUS (2026-05-30, free-tier key) ────────────────────────────
//  gemini-2.5-flash : 4/4 LIVE, quality 100% (grouping+bilingual+order all OK),
//                     real-coordinate join 8/8 on the AcroForm PDF,
//                     avg ~19.7s (text ~17s, PDF ~26s).
//  gemini-2.5-pro   : 0/4 live — HTTP 429, free-tier "limit: 0" for this key
//                     (paid plan only). The analyzer caught it, retried, and fell
//                     back to the SBA mock cleanly — i.e. the trust boundary held.
//  => DEFAULT = gemini-2.5-flash (fastest model that stays accurate AND the only
//     one available on the free tier). Set via GEMINI_MODEL; lib/ai defaults to it.
//     Re-run on a paid key to compare pro head-to-head.
// ────────────────────────────────────────────────────────────────────────────
import { readdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SAMPLES_DIR = path.join(ROOT, "scripts", "samples");
const MODELS = process.argv.slice(2).length ? process.argv.slice(2) : ["gemini-2.5-flash", "gemini-2.5-pro"];
const EXT_OK = new Set([".pdf", ".png", ".jpg", ".jpeg", ".txt"]);

function runChild(model, samplePath) {
  return new Promise((resolve) => {
    const child = spawn(
      process.execPath,
      ["--import", "./scripts/_register-alias.mjs", "scripts/_bench-one.mjs", model, samplePath],
      { cwd: ROOT },
    );
    let out = "";
    let errOut = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (errOut += d));
    child.on("close", () => {
      const line = out.trim().split("\n").filter(Boolean).pop();
      try {
        resolve(JSON.parse(line));
      } catch {
        resolve({ model, sample: path.basename(samplePath), ok: false, err: errOut.trim().slice(0, 200) || "no output" });
      }
    });
  });
}

async function main() {
  let samples = [];
  try {
    samples = (await readdir(SAMPLES_DIR)).filter((f) => EXT_OK.has(path.extname(f).toLowerCase())).sort();
  } catch {
    /* none */
  }
  if (!samples.length) {
    console.log("No samples — run `node scripts/make-samples.mjs` first.");
    process.exitCode = 1;
    return;
  }
  console.log(`Benchmark: ${MODELS.join(" vs ")}  ×  ${samples.length} sample(s)\n`);

  const perModel = new Map(MODELS.map((m) => [m, []]));
  const rows = [];
  for (const model of MODELS) {
    for (const s of samples) {
      const r = await runChild(model, path.join(SAMPLES_DIR, s));
      perModel.get(model).push(r);
      rows.push({
        model,
        sample: s,
        ms: r.ms ?? "",
        mock: r.isMock ? "yes" : "",
        reqs: r.requirements ?? "",
        flags: r.flags ?? "",
        group: r.grouping_ok === undefined ? "" : r.grouping_ok ? "✓" : "✗",
        bi: r.bilingual_ok === undefined ? "" : r.bilingual_ok ? "✓" : "✗",
        order: r.order_ok === undefined ? "" : r.order_ok ? "✓" : "✗",
        acro: r.acro_match ?? "",
        err: r.ok ? "" : (r.err || "fail").slice(0, 40),
      });
    }
  }
  console.table(rows);

  console.log("\nSummary (quality is computed over LIVE rows only — mock fallbacks don't count):");
  for (const model of MODELS) {
    const all = perModel.get(model);
    const live = all.filter((r) => r.ok && !r.isMock);
    const mock = all.filter((r) => r.ok && r.isMock).length;
    const failed = all.filter((r) => !r.ok).length;
    if (!live.length) {
      console.log(`  ${model}: 0 live runs (${mock} fell back to mock, ${failed} errored) — model unavailable on this key (quota/plan?)`);
      continue;
    }
    const avgMs = Math.round(live.reduce((n, r) => n + (r.ms || 0), 0) / live.length);
    const quality = live.reduce((n, r) => n + ([r.grouping_ok, r.bilingual_ok, r.order_ok].filter(Boolean).length / 3), 0) / live.length;
    console.log(`  ${model}: avg ${avgMs}ms · quality ${(quality * 100).toFixed(0)}% over ${live.length} live (${mock} mock, ${failed} err)`);
  }
  console.log("\nRule of thumb: pick the fastest model whose quality stays ~100%. Set it via GEMINI_MODEL in .env.local.");
}

main();
