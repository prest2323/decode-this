// Test-harness loader: resolves the `@/…` path alias (tsconfig "paths") so the
// offline self-test can import the real lib/*.ts modules unchanged. Node 26 runs
// .ts directly (native type-stripping); this only teaches it where `@/` points.
// Used by scripts/selftest.mjs — never imported by the app itself.
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const base = path.join(ROOT, specifier.slice(2));
      for (const cand of [base + ".ts", base + ".tsx", base, path.join(base, "index.ts")]) {
        if (existsSync(cand)) return { url: pathToFileURL(cand).href, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});
