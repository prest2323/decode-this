"use client";
// ChecklistPanel — template owner Aiden. The "Checklist" view: every Requirement
// as a step, grouped by status, with a type icon + flag hints. Click a step to
// jump the tour there (goTo). Highlights the active step. Reads useDoc().
import { useDoc } from "@/lib/store";
import type { RequirementType } from "@/lib/types";

const TYPE_ICON: Record<RequirementType, string> = {
  "fill-field": "✏️",
  "gather-document": "📎",
  "external-action": "🌐",
  sign: "🖊️",
  "pay-fee": "💵",
};

export default function ChecklistPanel() {
  const { reqs, activeIndex, lang, goTo } = useDoc();
  if (reqs.length === 0) return null;
  const done = reqs.filter((r) => r.status === "done").length;

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-sm font-bold text-slate-900">✅ Checklist</div>
        <div className="text-xs text-slate-500">
          {done}/{reqs.length} done
        </div>
      </div>
      <ol className="min-h-0 flex-1 overflow-auto p-2">
        {reqs.map((r, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className={`flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition ${
                  isActive ? "bg-amber-50 ring-1 ring-amber-200" : "hover:bg-slate-50"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    r.status === "done"
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-amber-400 text-white"
                        : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {r.status === "done" ? "✓" : r.order}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-slate-800">
                    {TYPE_ICON[r.type]} {r.title[lang]}
                  </span>
                  {r.flags.length > 0 && (
                    <span className="block truncate text-xs text-slate-400">
                      {r.flags.map((f) => f.label[lang]).join(" · ")}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
