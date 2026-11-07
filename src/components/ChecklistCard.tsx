"use client";

import Link from "next/link";
import { AREAS } from "@/lib/areas";
import type { ChecklistInstance } from "@/lib/checklists";
import { formatTime } from "@/lib/dates";
import { useStore } from "@/lib/store";

export function ChecklistCard({ list, subtitle }: { list: ChecklistInstance; subtitle?: string }) {
  const { state, toggleCheck } = useStore();
  const checked = new Set(state.checks[list.checksKey] ?? []);
  const done = list.items.filter((i) => checked.has(i.id)).length;
  const total = list.items.length;
  const complete = done === total;

  return (
    <div className={`card ${complete ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{list.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold leading-tight">{list.name}</p>
          <p className="text-xs text-zinc-500">
            {subtitle ?? `at ${formatTime(list.triggers[0].at)}`}
            {state.settings.areas.length > 1 && ` · ${AREAS[list.area].emoji} ${AREAS[list.area].label}`}
          </p>
        </div>
        <span
          className={`chip ${
            complete
              ? "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30"
              : "bg-white/[0.06] text-zinc-300"
          }`}
        >
          {complete ? "✓ Done" : `${done}/${total}`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ${complete ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.9)]" : "bg-gradient-to-r from-violet-500 to-cyan-400 shadow-[0_0_12px_rgba(139,92,246,0.8)]"}`}
          style={{ width: `${(done / total) * 100}%` }}
        />
      </div>
      <ul className="flex flex-col">
        {list.items.map((item) => {
          const on = checked.has(item.id);
          return (
            <li key={item.id}>
              <label className="flex items-center gap-3 py-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-5 w-5 accent-violet-500"
                  checked={on}
                  onChange={() => toggleCheck(list.checksKey, item.id)}
                />
                <span className={on ? "line-through text-zinc-500" : "text-zinc-200"}>{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="text-right">
        <Link href={list.editHref} className="btn-ghost text-xs">
          Edit
        </Link>
      </div>
    </div>
  );
}
