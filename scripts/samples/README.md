# Eval samples

Drop real documents here to benchmark extraction — `.pdf`, `.png`, `.jpg`, or `.txt`.
The eval harness (`scripts/eval.mjs`) base64-encodes each and POSTs it to
`/api/analyze`, then prints requirements/flags found, fill-field groups,
`grouping_ok` (did street+city+state+zip collapse into ONE requirement?), and latency.

```bash
npm run dev          # one terminal; add GEMINI_API_KEY to .env.local for LIVE extraction
npm run eval         # another terminal (or: node scripts/eval.mjs)
```

With **no** API key the analyzer returns the SBA mock, so the harness still runs and
the grouping check is exercised offline. Add a key to measure real extraction.

(This folder is intentionally empty of documents — add your own; they're git-ignored
unless you choose to commit them.)
