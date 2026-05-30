"use client";
// LiveDemo — an auto-playing, looping miniature of the real product, used as the
// hero visual. It walks itself through a few SBA steps: a soft spotlight glides
// to each field group, the guide card updates, checklist items tick off, and the
// progress bar fills — then it celebrates and loops. Pure CSS transitions driven
// by one interval. Decorative (aria-hidden); the real app lives one click away.
//
// Design intent: large, legible, and *calm*. No thin saturated rings — the
// spotlight is a gentle warm halo with a soft tint, the dim is light, and every
// label is comfortably readable rather than micro-text.
import { useEffect, useState } from "react";

type Step = {
  /** checklist label */
  label: string;
  /** guide card */
  guideTitle: string;
  guideBody: string;
  /** spotlight rect in % of the doc area */
  spot: { top: number; height: number } | null;
  /** optional gentle flag shown on the guide card */
  flag?: string;
};

const STEPS: Step[] = [
  {
    label: "Business legal name",
    guideTitle: "Enter your legal business name",
    guideBody: "The exact name on your license — not a nickname.",
    spot: { top: 14, height: 14 },
  },
  {
    label: "Business address",
    guideTitle: "Fill in your address",
    guideBody: "Street, city, state, ZIP — all one calm step.",
    spot: { top: 32, height: 28 },
  },
  {
    label: "EIN & industry code",
    guideTitle: "Add your EIN",
    guideBody: "The 9-digit tax ID the IRS gave your business.",
    spot: { top: 64, height: 14 },
  },
  {
    label: "Declare ownership",
    guideTitle: "List owners of 20%+",
    guideBody: "Each one signs a personal guarantee — we flag it early.",
    spot: { top: 81, height: 14 },
    flag: "Personal guarantee",
  },
];

const CHECKLIST = STEPS.map((s) => s.label);

export default function LiveDemo() {
  const [i, setI] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setI((prev) => {
        if (prev >= STEPS.length - 1) {
          setDone(true);
          // brief celebration, then loop
          setTimeout(() => setDone(false), 1900);
          return 0;
        }
        return prev + 1;
      });
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const step = STEPS[i];
  const pct = done ? 100 : Math.round(((i + 1) / STEPS.length) * 100);

  return (
    <div className="relative w-full max-w-[600px]" aria-hidden>
      {/* soft brand glows — diffuse, never hard-edged */}
      <div className="pointer-events-none absolute -right-16 -top-16 -z-10 h-64 w-64 rounded-full bg-warm-soft/50 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-16 -left-16 -z-10 h-72 w-72 rounded-full bg-calm-soft/70 blur-[80px]" />

      <div className="overflow-hidden rounded-2xl border border-line-strong/70 bg-card shadow-lift">
        {/* titlebar */}
        <div className="shimmer-host flex items-center gap-2 border-b border-line bg-paper-2/80 px-5 py-3">
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="h-3 w-3 rounded-full bg-line-strong" />
          <span className="font-mono ml-2 truncate text-xs text-ink-faint">
            SBA-Form-1919.pdf
          </span>
          <span className="ml-auto flex items-center gap-2 rounded-full bg-calm-tint px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-calm-deep">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-calm-2 opacity-50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-calm-2" />
            </span>
            Live
          </span>
        </div>

        <div className="grid grid-cols-[0.9fr_1.1fr] gap-4 p-4">
          {/* LEFT — Protect + checklist */}
          <div className="flex flex-col gap-3.5">
            <div className="rounded-xl border border-line bg-paper/70 p-3.5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-calm">
                <span className="flex h-4 w-4 items-center justify-center rounded-md bg-calm-soft">
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.4-3 7.5-7 8.5-4-1-7-4.1-7-8.5V6l7-3z" /><path d="M9 12l2 2 4-4.5" /></svg>
                </span>
                Protect
              </div>
              <div className="font-display mt-1.5 text-[13px] font-semibold leading-snug text-ink">
                SBA 7(a) loan application
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-warm-soft/70 px-2 py-0.5 text-[10px] font-medium text-warm-deep">
                  Due Jun 30
                </span>
                <span className="rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-medium text-gold">
                  $2,500 fee
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-line bg-paper/70 p-2.5">
              {CHECKLIST.map((label, idx) => {
                const isDone = done || idx < i;
                const isActive = !done && idx === i;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors duration-300 ${
                      isActive ? "bg-calm-tint" : ""
                    }`}
                  >
                    <span
                      className={`flex shrink-0 items-center justify-center rounded-md border text-[8px] font-bold transition-all duration-300 ${
                        isDone
                          ? "border-calm bg-calm text-paper"
                          : isActive
                            ? "border-calm-2 bg-card"
                            : "border-line-strong bg-card"
                      }`}
                      style={{ width: "1.1rem", height: "1.1rem" }}
                    >
                      {isDone && "✓"}
                    </span>
                    <span
                      className={`text-[11px] font-medium leading-tight transition-colors duration-300 ${
                        isDone
                          ? "text-ink-faint line-through"
                          : isActive
                            ? "text-calm-deep"
                            : "text-ink-soft"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* progress */}
            <div className="mt-auto">
              <div className="h-2 w-full overflow-hidden rounded-full bg-paper-2">
                <div
                  className="h-full rounded-full bg-calm transition-all duration-700 ease-out"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
                {done ? "Complete" : `Step ${i + 1} of ${STEPS.length}`}
              </div>
            </div>
          </div>

          {/* RIGHT — document with the soft moving spotlight */}
          <div className="relative h-[320px] overflow-hidden rounded-xl border border-line bg-paper-2">
            {/* faux form rows */}
            <div className="space-y-3 p-4">
              <div className="h-2 w-1/2 rounded-full bg-line-strong/60" />
              <FormRow w="w-3/4" />
              <div className="grid grid-cols-2 gap-2">
                <FormRow />
                <FormRow />
              </div>
              <FormRow w="w-2/3" />
              <FormRow />
              <div className="grid grid-cols-3 gap-2">
                <FormRow />
                <FormRow />
                <FormRow />
              </div>
              <FormRow w="w-1/2" />
            </div>

            {/* dim + soft spotlight — gentle, not a harsh ring */}
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
                done ? "opacity-0" : "opacity-100"
              }`}
            >
              {step.spot && (
                <div
                  className="halo-breathe absolute left-3 right-3 rounded-xl transition-all duration-[850ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    top: `${step.spot.top}%`,
                    height: `${step.spot.height}%`,
                    background: "rgba(248,224,212,0.16)",
                  }}
                />
              )}
            </div>

            {/* guide card */}
            {!done ? (
              <div className="absolute bottom-3 left-3 right-3 rounded-xl border border-line bg-card/95 p-3.5 shadow-lift backdrop-blur-sm">
                {/* keyed by step -> the content gently crossfades in each step
                    instead of snapping, so it stays in sync with the spotlight glide */}
                <div key={i} className="animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.15em] text-calm">
                      Guide
                    </div>
                    {step.flag && (
                      <span className="rounded-full bg-clay-soft px-2 py-0.5 text-[10px] font-medium text-clay">
                        {step.flag}
                      </span>
                    )}
                  </div>
                  <div className="font-display mt-1 text-[13px] font-semibold leading-snug text-ink">
                    {step.guideTitle}
                  </div>
                  <div className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                    {step.guideBody}
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-calm/95 text-paper animate-scale-in">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper/20">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l4 4 10-11" /></svg>
                </span>
                <div className="font-display text-base font-semibold">
                  You&apos;re ready to file!
                </div>
                <div className="text-[11px] text-paper/80">
                  Every step handled — calmly.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormRow({ w = "w-full" }: { w?: string }) {
  return (
    <div className="space-y-1.5">
      <div className={`h-1.5 ${w} rounded-full bg-line-strong/40`} />
      <div className="h-5 rounded-md border border-line bg-card" />
    </div>
  );
}
