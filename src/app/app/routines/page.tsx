"use client";

import { useState } from "react";
import { AreaTag } from "@/components/AreaTag";
import { AREAS, NAG_LEVELS } from "@/lib/areas";
import { formatClock, WEEKDAYS_SHORT } from "@/lib/dates";
import { uid } from "@/lib/defaults";
import { useStore } from "@/lib/store";
import type { NagLevel, Routine } from "@/lib/types";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function describeDays(days: number[]): string {
  const s = [...days].sort().join(",");
  if (s === "0,1,2,3,4,5,6") return "Every day";
  if (s === "1,2,3,4,5") return "Weekdays";
  if (s === "0,6") return "Weekends";
  return DAY_ORDER.filter((d) => days.includes(d))
    .map((d) => WEEKDAYS_SHORT[d])
    .join(", ");
}

export default function RoutinesPage() {
  const { state, saveRoutine, deleteRoutine } = useStore();
  const [editing, setEditing] = useState<Routine | null>(null);
  const routines = state.routines.filter((r) => state.settings.areas.includes(r.area));

  const newRoutine = (): Routine => ({
    id: uid(),
    name: "",
    emoji: "",
    area: state.settings.areas[0] ?? "privat",
    time: "07:00",
    days: [1, 2, 3, 4, 5],
    items: [],
    nag: "normal",
  });

  return (
    <div>
      <p className="eyebrow">Routines</p>
      <div className="mt-3 flex items-end justify-between gap-4">
        <h1 className="display text-[clamp(3.5rem,10vw,6.5rem)]">The usual.</h1>
        {!editing && (
          <button className="btn-primary mb-2" onClick={() => setEditing(newRoutine())}>
            New routine
          </button>
        )}
      </div>
      <p className="mt-4 mb-8 max-w-lg text-ink-2">
        Checklists that come back on certain days, like before you leave home or packing your gym bag. Minna keeps reminding
        you until everything is checked off.
      </p>

      {editing && (
        <RoutineEditor
          initial={editing}
          onSave={(r) => {
            saveRoutine(r);
            setEditing(null);
          }}
          onCancel={() => setEditing(null)}
          onDelete={
            state.routines.some((r) => r.id === editing.id)
              ? () => {
                  deleteRoutine(editing.id);
                  setEditing(null);
                }
              : undefined
          }
        />
      )}

      <ul className="border-t border-line">
        {routines.map((r) => (
          <li key={r.id}>
            <button onClick={() => setEditing(r)} className="group flex w-full items-baseline gap-4 border-b border-line py-4 text-left">
              <span className="min-w-0 flex-1">
                <span className="block font-medium group-hover:text-accent-ink">{r.name}</span>
                <span className="mt-1 block text-sm text-ink-2">
                  {describeDays(r.days)} at {formatClock(r.time)} · {r.items.length} items · {NAG_LEVELS[r.nag].label}
                </span>
              </span>
              {state.settings.areas.length > 1 && <AreaTag area={r.area} />}
              <span className="text-sm text-ink-2 group-hover:text-ink">Edit</span>
            </button>
          </li>
        ))}
      </ul>
      {routines.length === 0 && !editing && <p className="py-16 text-center text-ink-2">No routines yet.</p>}
    </div>
  );
}

function RoutineEditor({
  initial,
  onSave,
  onCancel,
  onDelete,
}: {
  initial: Routine;
  onSave: (r: Routine) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const { state } = useStore();
  const [r, setR] = useState<Routine>(initial);
  const [newItem, setNewItem] = useState("");
  const set = (patch: Partial<Routine>) => setR((cur) => ({ ...cur, ...patch }));
  const addItem = () => {
    const text = newItem.trim();
    if (!text) return;
    set({ items: [...r.items, { id: uid(), text }] });
    setNewItem("");
  };

  return (
    <div className="card mb-8 flex flex-col gap-5 !border-ink animate-fade">
      <div>
        <label className="label" htmlFor="rt-name">
          Name
        </label>
        <input id="rt-name" className="input" placeholder="e.g. Pack your gym bag" value={r.name} onChange={(e) => set({ name: e.target.value })} autoFocus />
      </div>

      {state.settings.areas.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Area">
          {state.settings.areas.map((a) => (
            <button key={a} type="button" role="radio" aria-checked={r.area === a} className={`seg ${r.area === a ? "seg-on" : ""}`} onClick={() => set({ area: a })}>
              {AREAS[a].label}
            </button>
          ))}
        </div>
      )}

      <div>
        <p className="label">Days</p>
        <div className="flex gap-1">
          {DAY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={r.days.includes(d)}
              onClick={() => set({ days: r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d] })}
              className={`seg flex-1 !px-0 !text-xs ${r.days.includes(d) ? "seg-on" : ""}`}
            >
              {WEEKDAYS_SHORT[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="rt-time">
            Time
          </label>
          <input id="rt-time" type="time" className="input" value={r.time} onChange={(e) => set({ time: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="rt-nag">
            Reminders
          </label>
          <select id="rt-nag" className="input" value={r.nag} onChange={(e) => set({ nag: e.target.value as NagLevel })}>
            {(Object.keys(NAG_LEVELS) as NagLevel[]).map((n) => (
              <option key={n} value={n}>
                {NAG_LEVELS[n].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <p className="label">Items on the list</p>
        <ul className="mb-2 border-t border-line">
          {r.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 border-b border-line py-2">
              <span className="flex-1 text-sm">{item.text}</span>
              <button className="btn-ghost text-xs" onClick={() => set({ items: r.items.filter((i) => i.id !== item.id) })} aria-label={`Remove ${item.text}`}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addItem();
          }}
        >
          <input className="input" placeholder="Add an item" aria-label="New item" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
          <button className="btn-secondary" disabled={!newItem.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2">
        {onDelete && (
          <button className="btn-ghost !text-[#b42318]" onClick={onDelete}>
            Delete routine
          </button>
        )}
        <div className="flex-1" />
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn-primary" disabled={!r.name.trim() || r.days.length === 0 || r.items.length === 0} onClick={() => onSave({ ...r, name: r.name.trim() })}>
          Save
        </button>
      </div>
    </div>
  );
}
