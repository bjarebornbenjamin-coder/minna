"use client";

import { AREAS } from "@/lib/areas";
import { useStore } from "@/lib/store";
import type { AreaId } from "@/lib/types";

export type AreaFilterValue = AreaId | "alla";

export function AreaFilter({ value, onChange }: { value: AreaFilterValue; onChange: (v: AreaFilterValue) => void }) {
  const { state } = useStore();
  const areas = state.settings.areas;
  if (areas.length < 2) return null;
  const opts: { v: AreaFilterValue; label: string }[] = [{ v: "alla", label: "All" }, ...areas.map((a) => ({ v: a, label: AREAS[a].label }))];
  return (
    <div className="flex gap-5 border-b border-line text-sm" role="tablist" aria-label="Filter by area">
      {opts.map((o) => (
        <button
          key={o.v}
          role="tab"
          aria-selected={value === o.v}
          onClick={() => onChange(o.v)}
          className={`-mb-px border-b-2 pb-2 transition-colors ${value === o.v ? "border-ink text-ink" : "border-transparent text-ink-2 hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
