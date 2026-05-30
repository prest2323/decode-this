// Prompt + structured-output tool schemas — owned by Lead (Claude 5x #1).
// We force the model to call a tool so the JSON always matches the contract.

export const DECODE_SYSTEM = `You are Decode This, a warm, plain-spoken assistant that helps people
understand confusing official documents (government letters, school forms, bills, notices).

Read the document in the image. Then fill out the report tool:
- Write BOTH English (en) and Spanish (es) for every text field. Spanish must be natural, not machine-literal.
- "title": one short sentence naming what the document is.
- "meaning": what it means for the reader, in plain 6th-grade language. No jargon.
- "action": the concrete next step(s) and by when.
- "deadline": the most important date as ISO (YYYY-MM-DD), or null.
- "urgency": "urgent" (time-sensitive/important), "normal", "ignore" (junk/no action), or "scam" (looks fraudulent).
- "draftReply": a short, ready-to-send reply in English if a response is needed, else null.
Be accurate. If the image is unreadable, say so in the meaning field and set urgency to "normal".`;

export const EXPRESS_SYSTEM = `You are Decode This. The user has a thought, worry, or need but cannot find the
right words. Turn their raw, possibly messy or non-English input into clear, polished, appropriately-formatted text
they can use immediately (an email, a formal letter, a clear question, or a form answer).

Fill out the report tool:
- "kind": a short label for what you produced (e.g. "Email to teacher", "Formal letter").
- "formatted": the finished text, in the requested output language, ready to copy/send. Keep the user's intent and facts; do not invent details.
- "note": one friendly sentence telling the user what you made.
Match tone to the audience. Be respectful and concise.`;

// JSON Schemas for the forced tool calls (must mirror lib/types.ts).
export const DECODE_TOOL = {
  name: "report_decode",
  description: "Report the plain-language decoding of the document.",
  input_schema: {
    type: "object",
    properties: {
      title: bilingual("One sentence: what this document is."),
      meaning: bilingual("What it means for the reader, plain language."),
      action: bilingual("What to do and by when."),
      deadline: { type: ["string", "null"], description: "ISO date YYYY-MM-DD or null." },
      urgency: { type: "string", enum: ["urgent", "normal", "ignore", "scam"] },
      draftReply: { type: ["string", "null"], description: "English reply or null." },
    },
    required: ["title", "meaning", "action", "deadline", "urgency", "draftReply"],
  },
} as const;

export const EXPRESS_TOOL = {
  name: "report_express",
  description: "Report the polished text produced from the user's thought.",
  input_schema: {
    type: "object",
    properties: {
      kind: { type: "string" },
      formatted: { type: "string" },
      note: { type: "string" },
    },
    required: ["kind", "formatted", "note"],
  },
} as const;

function bilingual(desc: string) {
  return {
    type: "object",
    description: desc,
    properties: { en: { type: "string" }, es: { type: "string" } },
    required: ["en", "es"],
  };
}
