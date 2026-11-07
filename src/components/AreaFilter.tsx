"use client";

import { AREAS } from "@/lib/areas";
import { useStore } from "@/lib/store";
import type { AreaId } from "@/lib/types";

export type AreaFilterValue = AreaId | "alla";

export function AreaFilter({ value, onChange }: { value: AreaFilterValue; onChange: (v: AreaFilterValue) => void }) {
  const { state } = useStore();
  const areas = state.settings.areas;
  if (areas.length < 2) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button className={`seg ${value === "alla" ? "seg-on" : ""}`} onClick={() => onChange("alla")}>
        Alla
      </button>
      {areas.map((a) => (
        <button key={a} className={`seg whitespace-nowrap ${value === a ? "seg-on" : ""}`} onClick={() => onChange(a)}>
          {AREAS[a].emoji} {AREAS[a].label}
        </button>
      ))}
    </div>
  );
}
