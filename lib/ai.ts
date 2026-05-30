// PROVIDER CLIENT — owned by Preston (Lead). Auto-selects the AI backend by
// which key is set, exactly like the old app: Gemini (free) is the default,
// Anthropic is the fallback, and with NO key we run on mock so the whole app
// works offline and on stage. extract/chat import provider() and fall back to
// mock on any failure — the demo can never hang on the network.
import { GoogleGenAI } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";

export type Provider = "gemini" | "anthropic" | "mock";

export function provider(): Provider {
  if (process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  return "mock";
}

export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001";

export function geminiClient(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
}

export function anthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY as string });
}
