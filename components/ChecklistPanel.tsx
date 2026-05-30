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
    <section className="flex min-h-0 flex-1 flex-col rounded-md border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="text-xs font-black uppercase tracking-wider text-slate-800">✅ Checklist</div>
        <div className="text-[11px] font-bold text-slate-500">
          {done}/{reqs.length} done
        </div>
      </div>
      <ol className="min-h-0 flex-1 overflow-auto p-2 space-y-1">
        {reqs.map((r, i) => {
          const isActive = i === activeIndex;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => goTo(i)}
                className={`flex w-full items-start gap-2 rounded px-2.5 py-2 text-left transition select-none cursor-pointer ${
                  isActive 
                    ? "bg-slate-100 ring-1 ring-slate-350 shadow-sm" 
                    : "hover:bg-slate-50/70"
                }`}
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                    r.status === "done"
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-slate-900 text-white"
                        : "bg-slate-150 text-slate-600 border border-slate-200/50"
                  }`}
                >
                  {r.status === "done" ? "✓" : r.order}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-xs font-bold text-slate-800">
                    {TYPE_ICON[r.type]} {r.title[lang]}
                  </span>
                  {r.flags.length > 0 && (
                    <span className="block truncate text-[10px] font-medium text-slate-400">
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
