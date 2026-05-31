"use client";
// Landing — the marketing home shown before a document is loaded. Editorial,
// warm, and alive: a drifting aurora hero with a big auto-playing product demo,
// scroll-revealed sections, three fully-detailed lens visuals, a rich sample
// gallery, the Uploader, and a closing reassurance.
//
// Design intent: soft + legible + animated. Terracotta appears only as gentle
// warm washes (animated highlighter swash, soft pills) — never thin saturated
// strokes. Eucalyptus carries structure; motion + whitespace carry the calm.
import Image from "next/image";
import { useDoc } from "@/lib/store";
import { MOCK_SBA, MOCK_VARIANTS } from "@/lib/mock";
import type { DocumentModel } from "@/lib/types";
import Uploader from "@/components/Uploader";
import { Wordmark } from "@/components/Wordmark";
import LiveDemo from "@/components/LiveDemo";
import { Reveal } from "@/components/Reveal";
import { Tilt, Magnetic, Parallax, CursorSpotlight } from "@/components/motion";

const SAMPLES: {
  key: string;
  label: string;
  sub: string;
  who: string;
  icon: React.ReactNode;
}[] = [
  { key: "sba", label: "SBA loan", sub: "Form 1919", who: "Small business owners", icon: <IconBuilding /> },
  { key: "lease", label: "Lease", sub: "12-month rental", who: "Renters", icon: <IconKey /> },
  { key: "benefits", label: "Food benefits", sub: "CalFresh renewal", who: "Families", icon: <IconBasket /> },
  { key: "uscis", label: "Citizenship", sub: "Form N-400", who: "New Americans", icon: <IconFlag /> },
];

// One headline word that rises out of a clipped line box, on a timed delay.
function W({ children, d }: { children: React.ReactNode; d: number }) {
  return (
    <span className="word-mask">
      <span className="word" style={{ animationDelay: `${d}ms` }}>
        {children}
      </span>
    </span>
  );
}

// Soft pill eyebrow — a warm wash, not a skinny line.
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-warm-soft/55 px-3.5 py-1.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-warm-deep">
      {children}
    </span>
  );
}

export default function Landing() {
  const { loadDoc } = useDoc();
  const tryDoc = (d: DocumentModel) => loadDoc(d);

  return (
    <main className="bg-atmosphere relative min-h-screen overflow-x-hidden">
      {/* ── Top nav ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-line/60 bg-paper/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="animate-rise"><Wordmark /></div>
          <nav className="flex items-center gap-1">
            <a href="#walkthrough" className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper-2 hover:text-ink md:block">
              How it works
            </a>
            <a href="#samples" className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink-soft transition hover:bg-paper-2 hover:text-ink md:block">
              Samples
            </a>
            <button
              type="button"
              onClick={() => tryDoc(MOCK_SBA)}
              className="ml-2 rounded-full bg-calm px-5 py-2.5 text-sm font-semibold text-paper shadow-soft transition hover:-translate-y-0.5 hover:bg-calm-deep hover:shadow-lift"
            >
              Launch demo →
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative">
        {/* drifting aurora + faint dot-grid texture + cursor spotlight */}
        <div className="aurora" aria-hidden />
        <div className="dot-grid pointer-events-none absolute inset-0" aria-hidden />
        <CursorSpotlight />

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-28 pt-16 lg:grid-cols-[0.92fr_1.08fr] lg:pt-24">
          <div>
            {/* animated kicker — replaces the old category eyebrow */}
            <div className="animate-rise flex items-center gap-2.5 text-sm font-medium text-calm-deep" style={{ animationDelay: "0ms" }}>
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-calm-2 opacity-50" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-calm-2" />
              </span>
              A calmer way through hard paperwork
            </div>

            <h1 className="font-display mt-6 text-[3.1rem] font-semibold leading-[1.03] tracking-tight text-ink sm:text-[4.1rem]">
              <W d={120}>Put</W> <W d={185}>your</W> <W d={250}>next</W>{" "}
              <W d={315}>step</W>
              <br />
              <W d={400}>in</W> <W d={460}>the</W>{" "}
              <span className="relative whitespace-nowrap text-calm">
                {/* swash sits OUTSIDE the clip-mask so its extension isn't cut */}
                <span
                  className="swash-anim absolute inset-x-[-0.14em] bottom-[0.05em] -z-10 h-[0.64em] -rotate-1 rounded-[0.3em]"
                  aria-hidden
                />
                <span className="word-mask">
                  <span className="word" style={{ animationDelay: "540ms" }}>
                    spotlight
                  </span>
                </span>
              </span>
              <span className="word" style={{ animationDelay: "560ms" }}>
                .
              </span>
            </h1>

            <p
              className="animate-rise mt-7 max-w-md text-lg leading-[1.7] text-ink-soft"
              style={{ animationDelay: "160ms" }}
            >
              Loan applications, leases, benefits forms, citizenship papers — the
              documents that decide people&apos;s lives are also the scariest to
              fill out. <span className="font-semibold text-ink">Decode It</span>{" "}
              turns any of them into a calm, guided, bilingual walkthrough.
            </p>

            <div
              className="animate-rise mt-9 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Magnetic strength={10}>
                <button
                  type="button"
                  onClick={() => tryDoc(MOCK_SBA)}
                  className="group relative overflow-hidden rounded-full bg-calm px-8 py-4 text-base font-semibold text-paper shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-calm-deep hover:shadow-lift"
                >
                  <span className="relative z-10">Launch the live demo →</span>
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>
              </Magnetic>
              <a
                href="#walkthrough"
                className="rounded-full border border-line-strong bg-card px-8 py-4 text-base font-medium text-ink transition-all duration-300 hover:-translate-y-0.5 hover:border-calm-2"
              >
                See how it works
              </a>
            </div>

            <div
              className="animate-fade-in mt-9 flex flex-wrap items-center gap-2.5 text-sm font-medium text-ink-soft"
              style={{ animationDelay: "420ms" }}
            >
              <span className="flex items-center gap-2 rounded-full border border-line bg-card/70 px-3.5 py-1.5 shadow-soft backdrop-blur-sm"><Dot /> Runs fully offline</span>
              <span className="flex items-center gap-2 rounded-full border border-line bg-card/70 px-3.5 py-1.5 shadow-soft backdrop-blur-sm"><Dot /> English &amp; Spanish</span>
              <span className="flex items-center gap-2 rounded-full border border-line bg-card/70 px-3.5 py-1.5 shadow-soft backdrop-blur-sm"><Dot /> Nothing leaves your device</span>
            </div>
          </div>

          {/* live demo — the larger, calmer star of the hero */}
          <div className="animate-fade-in flex justify-center lg:justify-end" style={{ animationDelay: "320ms" }}>
            <Tilt glow max={5} className="w-full max-w-[600px]">
              <LiveDemo />
              {/* floating glass stat card — adds depth + interest */}
              <div className="floaty-soft absolute -bottom-6 -left-6 z-20 hidden rounded-2xl border border-line bg-card/95 px-4 py-3 shadow-lift backdrop-blur-md sm:block">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-calm-soft text-calm">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11" /></svg>
                  </span>
                  <div>
                    <div className="font-display text-sm font-semibold leading-tight text-ink">9 calm steps</div>
                    <div className="text-[11px] leading-tight text-ink-soft">~4 min, start to finish</div>
                  </div>
                </div>
              </div>
            </Tilt>
          </div>
        </div>
      </section>

      {/* ── Impact strip ────────────────────────────────────────── */}
      <section className="relative border-y border-line/60 bg-calm text-paper">
        <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: "radial-gradient(40rem 20rem at 20% 0%, rgba(215,90,50,0.25), transparent 60%)" }} />
        <div className="relative mx-auto grid max-w-6xl grid-cols-2 gap-y-10 px-6 py-14 sm:grid-cols-4">
          {[
            { stat: "30+", unit: "pages", label: "of legalese in one SBA form", icon: <IconPages /> },
            { stat: "1 in 5", unit: "adults", label: "struggle with dense forms", icon: <IconPeople /> },
            { stat: "$0", unit: "cost", label: "no consultant required", icon: <IconCoin /> },
            { stat: "EN · ES", unit: "bilingual", label: "from end to end", icon: <IconGlobe /> },
          ].map((m, idx) => (
            <Reveal key={m.label} delay={idx * 90} dir="up" className="px-2">
              <div className="text-center sm:text-left">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-paper/15 text-paper">
                  {m.icon}
                </div>
                <div className="font-display text-[2.3rem] font-semibold leading-none">{m.stat}</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-warm-soft/90">{m.unit}</div>
                <div className="mt-2 text-sm leading-relaxed text-paper/70">{m.label}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Walkthrough: the three lenses ───────────────────────── */}
      <section id="walkthrough" className="mx-auto max-w-6xl px-6 py-28">
        <Reveal dir="up">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center"><Eyebrow>How it works</Eyebrow></div>
            <h2 className="font-display mt-5 text-[2.1rem] font-semibold leading-[1.12] text-ink sm:text-[2.9rem]">
              One document. Three calm lenses.
            </h2>
            <p className="mt-5 text-lg leading-[1.7] text-ink-soft">
              We read the whole thing once, then show it to you three ways — so you
              always know what matters, where to look, and what to do next.
            </p>
          </div>
        </Reveal>

        <div className="mt-24 flex flex-col gap-28">
          <WalkRow
            n="01"
            tag="Protect"
            title="See the traps before you start"
            body="The moment a document loads, we translate it into a three-sentence plain-language summary and surface the hidden traps — deadlines, fees, background checks, legal commitments — as gentle, color-coded flags. No more nasty surprises buried on page 27."
            bullets={["Plain-language summary", "Prioritized risk flags", "Read it in seconds, not hours"]}
            visual={<ProtectVisual />}
          />
          <WalkRow
            n="02"
            reverse
            tag="Guide"
            title="One spotlight at a time"
            body="The whole form becomes an ordered checklist. As you move through it, a single soft spotlight lands on exactly the fields you need — related boxes grouped together — and a guide card explains them in 5th-grade language. Never a wall of flashing red boxes."
            bullets={["Grouped, collision-free spotlights", "Step-by-step guidance", "Off-page tasks tracked too"]}
            visual={<GuideVisual />}
          />
          <WalkRow
            n="03"
            tag="Ask"
            title="A calm answer, grounded in your step"
            body="Stuck on a term? Ask in plain words. The assistant already knows which step you're on and what the document says, so it answers simply and specifically — no search engines, no rabbit holes, no jargon."
            bullets={["Context-aware of your exact step", "Answers in plain language", "Works offline on-device"]}
            visual={<AskVisual />}
          />
        </div>
      </section>

      {/* ── Sample gallery ──────────────────────────────────────── */}
      <section id="samples" className="relative border-y border-line/60 bg-paper-2/50">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <Reveal dir="up">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Eyebrow>Try it on a real one</Eyebrow>
                <h2 className="font-display mt-4 text-[2.1rem] font-semibold text-ink sm:text-[2.6rem]">
                  Built for the people forms forget
                </h2>
              </div>
              <span className="rounded-full bg-card px-4 py-2 text-sm text-ink-soft shadow-soft">
                Loads instantly — no upload, no account
              </span>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SAMPLES.map((s, idx) => (
              <Reveal key={s.key} delay={idx * 80} dir="up" className="h-full">
                <Tilt max={6} className="h-full">
                <button
                  type="button"
                  onClick={() => tryDoc(MOCK_VARIANTS[s.key])}
                  className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-line bg-card p-6 text-left shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-calm-2 hover:shadow-lift"
                >
                  {/* pointer-follow glow (reads --mx/--my from the Tilt wrapper) */}
                  <span
                    className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{ background: "radial-gradient(16rem 16rem at var(--mx,50%) var(--my,50%), rgba(194,103,75,0.10), transparent 60%)" }}
                  />
                  {/* hover wash */}
                  <span className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-warm-soft/40 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                  <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-calm-soft text-calm transition-transform duration-300 group-hover:scale-110 group-hover:bg-calm group-hover:text-paper">
                    {s.icon}
                  </span>
                  <span className="relative mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-deep">{s.who}</span>
                  <span className="font-display relative mt-1.5 text-xl font-semibold text-ink">{s.label}</span>
                  <span className="font-mono relative mt-1 text-xs text-ink-faint">{s.sub}</span>
                  <span className="relative mt-6 flex items-center gap-1.5 text-sm font-semibold text-calm">
                    Decode it
                    <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                  </span>
                </button>
                </Tilt>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bring your own ──────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 py-28">
        <Reveal dir="up">
          <div className="text-center">
            <div className="flex justify-center"><Eyebrow>Your turn</Eyebrow></div>
            <h2 className="font-display mt-5 text-[2.1rem] font-semibold leading-[1.12] text-ink sm:text-[2.6rem]">
              Have a document of your own?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg leading-[1.7] text-ink-soft">
              Bring the one that&apos;s been sitting on your desk. We&apos;ll take
              it from here — gently.
            </p>
          </div>
        </Reveal>
        <Reveal dir="up" delay={120}>
          <div className="mt-12">
            <Uploader />
          </div>
        </Reveal>
      </section>

      {/* ── Closing CTA ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Reveal dir="none">
          <div
            className="relative overflow-hidden rounded-[2rem] px-8 py-20 text-center shadow-lift sm:px-16"
            style={{ background: "linear-gradient(135deg, #1c5959 0%, #0f524a 55%, #0a3a34 100%)" }}
          >
            <div className="drift-slow pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-warm/20 blur-[80px]" />
            <div className="drift-slow-2 pointer-events-none absolute -bottom-24 -right-12 h-80 w-80 rounded-full bg-warm/12 blur-[90px]" />
            <Image src="/logo.svg" alt="" width={64} height={64} className="floaty-soft relative mx-auto mb-6 brightness-0 invert" aria-hidden />
            <h2 className="font-display relative mx-auto max-w-xl text-[2.1rem] font-semibold leading-[1.15] text-paper sm:text-[2.7rem]">
              You don&apos;t have to face the paperwork alone.
            </h2>
            <p className="relative mx-auto mt-5 max-w-md text-lg leading-relaxed text-paper/80">
              Take a breath. Then let&apos;s take it one calm step at a time.
            </p>
            <button
              type="button"
              onClick={() => tryDoc(MOCK_SBA)}
              className="relative mt-9 rounded-full bg-paper px-8 py-4 text-base font-semibold text-calm-deep shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:bg-card"
            >
              Launch the demo →
            </button>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-line/60 pt-8 sm:flex-row">
          <Wordmark size={28} textClass="text-base" />
          <p className="text-sm text-ink-soft">Making hard paperwork feel human.</p>
        </div>
      </section>
    </main>
  );
}

/* ── Walkthrough row ───────────────────────────────────────────── */
function WalkRow({
  n,
  tag,
  title,
  body,
  bullets,
  visual,
  reverse,
}: {
  n: string;
  tag: string;
  title: string;
  body: string;
  bullets: string[];
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2">
      <Reveal dir={reverse ? "left" : "right"} className={reverse ? "lg:order-2" : ""}>
        <div className="flex items-center gap-4">
          <span className="num-gradient font-display text-[3.4rem] font-bold leading-none tracking-tight">{n}</span>
          <Eyebrow>{tag}</Eyebrow>
        </div>
        <h3 className="font-display mt-4 text-2xl font-semibold leading-[1.18] text-ink sm:text-[2rem]">
          {title}
        </h3>
        <p className="mt-4 max-w-md text-[1.05rem] leading-[1.7] text-ink-soft">{body}</p>
        <ul className="mt-6 space-y-3">
          {bullets.map((b) => (
            <li key={b} className="flex items-center gap-3 text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-calm-soft text-calm">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11" /></svg>
              </span>
              <span className="text-[1rem]">{b}</span>
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal dir={reverse ? "right" : "left"} delay={120} className={`flex justify-center ${reverse ? "lg:order-1" : ""}`}>
        <Parallax speed={26} className="relative w-full max-w-[460px]">
          <div className="drift-slow relative">
            <div className="pointer-events-none absolute -inset-8 -z-10 rounded-3xl bg-calm-soft/35 blur-3xl" />
            {visual}
          </div>
        </Parallax>
      </Reveal>
    </div>
  );
}

/* ── Walkthrough visuals (static, on-brand, detailed) ──────────── */
function Frame({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong/70 bg-card shadow-lift">
      <div className="shimmer-host flex items-center gap-2 border-b border-line bg-paper-2/80 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
        <span className="font-mono ml-1 text-[11px] text-ink-faint">{label}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-calm-2">
          <span className="h-1.5 w-1.5 rounded-full bg-calm-2" /> Decode It
        </span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ProtectVisual() {
  return (
    <Frame label="Protect · summary + flags">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-calm">
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-calm-soft">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.4-3 7.5-7 8.5-4-1-7-4.1-7-8.5V6l7-3z" /><path d="M9 12l2 2 4-4.5" /></svg>
        </span>
        Plain-language summary
      </div>
      <Reveal dir="none" delay={120} amount={0.6}>
        <div className="mt-3 space-y-2 rounded-xl bg-paper/70 p-3.5">
          <div className="h-2.5 w-full rounded-full bg-line/80" />
          <div className="h-2.5 w-11/12 rounded-full bg-line/80" />
          <div className="h-2.5 w-3/4 rounded-full bg-line/70" />
        </div>
      </Reveal>
      <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.15em] text-ink-faint">Watch out for</div>
      <div className="mt-3 space-y-2">
        {[
          { tone: "warm", label: "Application deadline", detail: "Due Jun 30, 2026" },
          { tone: "gold", label: "Up-front cost", detail: "$2,500 packaging fee" },
          { tone: "calm", label: "Background check", detail: "All 20%+ owners" },
          { tone: "clay", label: "Personal guarantee", detail: "Your assets at risk" },
        ].map((f, i) => (
          <Reveal key={f.label} dir="left" delay={i * 110} amount={0.5}>
            <FlagRow tone={f.tone as "warm" | "gold" | "calm" | "clay"} label={f.label} detail={f.detail} />
          </Reveal>
        ))}
      </div>
    </Frame>
  );
}

function FlagRow({ tone, label, detail }: { tone: "warm" | "gold" | "calm" | "clay"; label: string; detail: string }) {
  const map = {
    warm: "bg-warm-soft/60 text-warm-deep",
    gold: "bg-gold-soft text-gold",
    calm: "bg-calm-soft text-calm-deep",
    clay: "bg-clay-soft text-clay",
  } as const;
  const dot = {
    warm: "bg-warm",
    gold: "bg-gold",
    calm: "bg-calm-2",
    clay: "bg-clay",
  } as const;
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-card px-3 py-2.5">
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[tone]}`} />
      <span className="text-[12px] font-semibold text-ink">{label}</span>
      <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[11px] font-medium ${map[tone]}`}>{detail}</span>
    </div>
  );
}

function GuideVisual() {
  return (
    <Frame label="Guided tour · step 2 of 9">
      <div className="relative h-[232px] overflow-hidden rounded-xl border border-line bg-paper-2 p-3.5">
        <div className="space-y-2.5">
          <div className="h-2 w-1/2 rounded-full bg-line-strong/50" />
          <div className="h-5 rounded-md border border-line bg-card" />
        </div>
        {/* spotlit group — soft warm halo, gently breathing */}
        <Reveal dir="none" delay={160} amount={0.5}>
          <div className="halo-breathe mt-2.5 rounded-xl p-2" style={{ background: "rgba(248,224,212,0.18)" }}>
            <div className="mb-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-warm-deep">Business address</div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-3 h-5 rounded-md border border-warm/40 bg-warm-soft/50" />
              <div className="col-span-2 h-5 rounded-md border border-warm/40 bg-warm-soft/50" />
              <div className="h-5 rounded-md border border-warm/40 bg-warm-soft/50" />
            </div>
          </div>
        </Reveal>
        <div className="mt-2.5 space-y-2.5 opacity-60">
          <div className="h-5 rounded-md border border-line bg-card" />
          <div className="grid grid-cols-3 gap-2">
            <div className="h-5 rounded-md border border-line bg-card" />
            <div className="h-5 rounded-md border border-line bg-card" />
            <div className="h-5 rounded-md border border-line bg-card" />
          </div>
        </div>
        <Reveal dir="up" delay={340} amount={0.5} className="absolute bottom-3 left-3 right-3">
          <div className="rounded-xl border border-line bg-card/95 p-3 shadow-lift backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-calm">Guide</div>
              <div className="flex gap-1">
                {[0, 1, 2].map((d) => (
                  <span key={d} className="h-1.5 w-1.5 rounded-full bg-calm-2" style={{ animation: "blink-dot 1.4s ease-in-out infinite", animationDelay: `${d * 0.18}s` }} />
                ))}
              </div>
            </div>
            <div className="font-display mt-1 text-[12px] font-semibold text-ink">Fill in your business address</div>
            <div className="mt-0.5 text-[10px] leading-relaxed text-ink-soft">Street, city, state, ZIP — all one calm step.</div>
          </div>
        </Reveal>
      </div>
    </Frame>
  );
}

function AskVisual() {
  return (
    <Frame label="Ask · grounded in your step">
      <div className="space-y-3">
        <Reveal dir="none" amount={0.6}>
          <div className="rounded-lg bg-calm-tint px-3 py-1.5 text-center text-[10px] font-medium text-calm-deep">
            On step 7 · “Declare ownership”
          </div>
        </Reveal>
        <Reveal dir="left" delay={150} amount={0.6}>
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-calm px-3.5 py-2.5 text-[12px] font-medium text-paper">
              What&apos;s a personal guarantee?
            </div>
          </div>
        </Reveal>
        <Reveal dir="up" delay={340} amount={0.5}>
          <div className="flex items-start gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-calm-soft text-calm">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-9 8.3 9 9 0 0 1-3.8-.7L3 20l1.3-3.8A8.38 8.38 0 0 1 3.5 11.5 8.5 8.5 0 0 1 12 3a8.5 8.5 0 0 1 9 8.5z" /></svg>
            </span>
            <div className="max-w-[82%] rounded-2xl rounded-tl-sm border border-line bg-card px-3.5 py-2.5 text-[12px] leading-relaxed text-ink">
              It means you personally promise to repay the loan if your business
              can&apos;t — your own savings or home could be on the line.
            </div>
          </div>
        </Reveal>
        <div className="flex items-center gap-2 pl-9 text-[10px] text-ink-faint">
          <span className="flex gap-1">
            {[0, 1, 2].map((d) => (
              <span key={d} className="h-1.5 w-1.5 rounded-full bg-line-strong" style={{ animation: "blink-dot 1.4s ease-in-out infinite", animationDelay: `${d * 0.18}s` }} />
            ))}
          </span>
          Answer drawn from page 6 — no web search
        </div>
      </div>
    </Frame>
  );
}

function Dot() {
  return <span className="h-2 w-2 rounded-full bg-calm-2/70" />;
}

/* ── Inline icons (stroke = currentColor) ──────────────────────── */
function IconBuilding() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M15 21V9h3a1 1 0 0 1 1 1v11M8 8h2M8 12h2M8 16h2" /></svg>;
}
function IconKey() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="4.5" /><path d="M11 11l8 8M16 16l2-2M19 19l1.5-1.5" /></svg>;
}
function IconBasket() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9h14l-1.2 9.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 9zM9 9 12 3l3 6M9.5 13v3M14.5 13v3" /></svg>;
}
function IconFlag() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4M5 4c3-2 6 2 9 0s4 0 4 0v9s-1 1.5-4 2-6-2-9 0" /></svg>;
}
function IconPages() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3h7l4 4v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM14 3v4h4M9 13h7M9 17h5" /></svg>;
}
function IconPeople() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6a3 3 0 0 1 0 6M17 14.5a5.5 5.5 0 0 1 3.5 5.5" /></svg>;
}
function IconCoin() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.2a2.2 2.2 0 0 1 2.5-1.2c1.4 0 2.2.8 2.2 1.8 0 2.4-4.7 1.2-4.7 3.6 0 1 .9 1.8 2.5 1.8a2.4 2.4 0 0 0 2.4-1.3" /></svg>;
}
function IconGlobe() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></svg>;
}
