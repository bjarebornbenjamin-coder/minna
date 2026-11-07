"use client";

import Link from "next/link";
import type { ChecklistInstance } from "@/lib/checklists";
import { formatTime } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { AreaTag } from "./AreaTag";

export function ChecklistCard({ list, subtitle }: { list: ChecklistInstance; subtitle?: string }) {
  const { state, toggleCheck } = useStore();
  const checked = new Set(state.checks[list.checksKey] ?? []);
  const done = list.items.filter((i) => checked.has(i.id)).length;
  const total = list.items.length;
  const complete = done === total;

  return (
    <div className="card">
      <div className="mb-3 flex items-baseline gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">{list.name}</p>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-2">
            <span>{subtitle ?? `At ${formatTime(list.triggers[0].at)}`}</span>
            {state.settings.areas.length > 1 && <AreaTag area={list.area} />}
          </p>
        </div>
        <span className={`text-xs tabular-nums ${complete ? "text-ink font-medium" : "text-ink-2"}`}>
          {complete ? "Done" : `${done} of ${total}`}
        </span>
      </div>
      <div className="mb-3 h-0.5 bg-bg-2" aria-hidden>
        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
      </div>
      <ul className="flex flex-col">
        {list.items.map((item) => {
          const on = checked.has(item.id);
          return (
            <li key={item.id}>
              <label className="flex cursor-pointer select-none items-center gap-3 py-1.5">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#1f7dbf]"
                  checked={on}
                  onChange={() => toggleCheck(list.checksKey, item.id)}
                />
                <span className={on ? "text-ink-2 line-through" : ""}>{item.text}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <div className="mt-1 text-right">
        <Link href={list.editHref} className="btn-ghost text-xs">
          Edit list
        </Link>
      </div>
    </div>
  );
}
