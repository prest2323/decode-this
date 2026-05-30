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
import FollowUp from "@/components/FollowUp";

export default function Home() {
  const [mode, setMode] = useState<Mode>("decode");
  const [lang, setLang] = useState<Lang>("en");
  const [loading, setLoading] = useState(false);
  const [decoded, setDecoded] = useState<DecodeResult | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [expressText, setExpressText] = useState("");
  const [audience, setAudience] = useState("");
  const [expressed, setExpressed] = useState<ExpressResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
  }

  async function call(payload: object): Promise<ApiResponse> {
    const res = await fetch("/api/decode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  async function onImage(dataUrl: string) {
    setImageUrl(dataUrl);
    setDecoded(null);
    setError(null);
    setLoading(true);
    const r = await call({ mode: "decode", image: dataUrl });
    if (r.ok && r.mode === "decode") setDecoded(r.result);
    else if (!r.ok) setError(r.error);
    setLoading(false);
  }

  async function onExpress() {
    setExpressed(null);
    setError(null);
    setLoading(true);
    const r = await call({ mode: "express", text: expressText, lang, audience: audience || undefined });
    if (r.ok && r.mode === "express") setExpressed(r.result);
    else if (!r.ok) setError(r.error);
    setLoading(false);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-5 py-8">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Decode This</h1>
        <p className="mt-1 text-gray-500">
          The bilingual kid who reads your mail — and helps you answer it.
        </p>
      </header>

      <div className="mx-auto inline-flex rounded-full bg-gray-100 p-1 text-sm font-semibold">
        <Tab active={mode === "decode"} onClick={() => switchMode("decode")}>
          📄 Decode a document
        </Tab>
        <Tab active={mode === "express"} onClick={() => switchMode("express")}>
          💬 Find my words
        </Tab>
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-center text-red-600">{error}</p>}

      {mode === "decode" ? (
        <section className="space-y-5">
          <Uploader onImage={onImage} loading={loading} />
          {loading && !decoded && <SkeletonCard />}
          {decoded && (
            <>
              <div className="flex items-center justify-between">
                <LanguageToggle lang={lang} onChange={setLang} />
                <ReadAloud
                  text={`${decoded.title[lang]}. ${decoded.meaning[lang]}. ${decoded.action[lang]}`}
                  lang={lang}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-[110px_1fr]">
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt="The document you scanned"
                    className="hidden h-32 w-full rounded-xl border border-gray-200 object-cover sm:block"
                  />
                )}
                <ResultCard result={decoded} lang={lang} />
              </div>
              <FollowUp context={decoded} lang={lang} />
            </>
          )}
        </section>
      ) : (
        <section className="space-y-5">
          <div className="flex justify-end">
            <MicInput lang={lang} onTranscript={(t) => setExpressText((p) => (p ? `${p} ${t}` : t))} />
          </div>
          <ExpressInput
            value={expressText}
            onChange={setExpressText}
            lang={lang}
            onLangChange={setLang}
            onSubmit={onExpress}
            loading={loading}
            audience={audience}
            onAudienceChange={setAudience}
          />
          {loading && !expressed && <SkeletonCard />}
          {expressed && <ExpressResultCard result={expressed} lang={lang} />}
        </section>
      )}

      <footer className="mt-auto pt-6 text-center text-xs text-gray-400">
        Built at Hack the Valley · Bakersfield · for the families who get the mail.
      </footer>
    </main>
  );
}

function SkeletonCard() {
  return (
    <div className="animate-pulse space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="h-7 w-44 rounded-full bg-gray-200" />
      <div className="h-8 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-full rounded bg-gray-100" />
      <div className="h-4 w-5/6 rounded bg-gray-100" />
    </div>
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
      className={`rounded-full px-4 py-2 transition ${active ? "bg-white text-gray-900 shadow" : "text-gray-500"}`}
    >
      {children}
    </button>
  );
}
