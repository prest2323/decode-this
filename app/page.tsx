// OWNER: Lead (Claude 5x #1) — integration. Wires every teammate's component.
// Don't put visual polish here; that lives in the components.
"use client";
import { useState } from "react";
import type { ApiResponse, DecodeResult, ExpressResult, Lang, Mode } from "@/lib/types";
import Uploader from "@/components/Uploader";
import ResultCard from "@/components/ResultCard";
import LanguageToggle from "@/components/LanguageToggle";
import ReadAloud from "@/components/ReadAloud";
import MicInput from "@/components/MicInput";
import ExpressInput from "@/components/ExpressInput";
import ExpressResultCard from "@/components/ExpressResult";

export default function Home() {
  const [mode, setMode] = useState<Mode>("decode");
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(false);
  const [decoded, setDecoded] = useState<DecodeResult | null>(null);
  const [expressText, setExpressText] = useState("");
  const [expressed, setExpressed] = useState<ExpressResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function call(payload: object): Promise<ApiResponse> {
    const res = await fetch("/api/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async function onImage(dataUrl: string) {
    setLoading(true);
    setError(null);
    const r = await call({ mode: "decode", image: dataUrl });
    if (r.ok && r.mode === "decode") setDecoded(r.result);
    else if (!r.ok) setError(r.error);
    setLoading(false);
  }

  async function onExpress() {
    setLoading(true);
    setError(null);
    const r = await call({ mode: "express", text: expressText, lang });
    if (r.ok && r.mode === "express") setExpressed(r.result);
    else if (!r.ok) setError(r.error);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight">Decode This</h1>
        <p className="mt-1 text-gray-500">
          It decodes everything — the paperwork you can&apos;t read, and the words you can&apos;t find.
        </p>
      </header>

      <div className="mx-auto inline-flex rounded-full bg-gray-100 p-1 text-sm font-semibold">
        <Tab active={mode === "decode"} onClick={() => setMode("decode")}>
          📄 Decode a document
        </Tab>
        <Tab active={mode === "express"} onClick={() => setMode("express")}>
          💬 Find my words
        </Tab>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-center text-red-600">{error}</p>}

      {mode === "decode" ? (
        <section className="space-y-5">
          <Uploader onImage={onImage} loading={loading} />
          {decoded && (
            <>
              <div className="flex items-center justify-between">
                <LanguageToggle lang={lang} onChange={setLang} />
                <ReadAloud
                  text={`${decoded.title[lang]}. ${decoded.meaning[lang]}. ${decoded.action[lang]}`}
                  lang={lang}
                />
              </div>
              <ResultCard result={decoded} lang={lang} />
            </>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex justify-end">
            <MicInput lang={lang} onTranscript={setExpressText} />
          </div>
          <ExpressInput
            value={expressText}
            onChange={setExpressText}
            lang={lang}
            onLangChange={setLang}
            onSubmit={onExpress}
            loading={loading}
          />
          {expressed && <ExpressResultCard result={expressed} />}
        </section>
      )}
    </main>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 transition ${active ? "bg-white shadow" : "text-gray-500"}`}
    >
      {children}
    </button>
  );
}
