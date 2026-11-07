"use client";

import { useState } from "react";
import { AREAS, NAG_LEVELS } from "@/lib/areas";
import { formatClock, WEEKDAYS_SHORT } from "@/lib/dates";
import { uid } from "@/lib/defaults";
import { useStore } from "@/lib/store";
import type { NagLevel, Routine } from "@/lib/types";

const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const EMOJIS = ["🚪", "🌙", "☀️", "🏋️", "🧳", "🗂️", "✅", "💊", "🛒", "🧹", "📚", "🐶"];

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
    emoji: "✅",
    area: state.settings.areas[0] ?? "privat",
    time: "07:00",
    days: [1, 2, 3, 4, 5],
    items: [],
    nag: "normal",
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-3xl font-semibold tracking-tight">Routines</h1>
        {!editing && (
          <button className="btn-primary" onClick={() => setEditing(newRoutine())}>
            + New
          </button>
        )}
      </div>
      <p className="text-sm text-zinc-500 mb-4">
        Checklists that show up on certain days, like “before you leave home” or “pack your gym bag”. I keep nudging
        until everything is checked off.
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

      <div className="flex flex-col gap-2 mt-2">
        {routines.map((r) => (
          <button
            key={r.id}
            onClick={() => setEditing(r)}
            className="card text-left flex items-center gap-3 hover:!border-violet-400/30 transition"
          >
            <span className="text-2xl">{r.emoji}</span>
            <span className="flex-1 min-w-0">
              <span className="block font-medium">{r.name}</span>
              <span className="block text-xs text-zinc-500">
                {describeDays(r.days)} at {formatClock(r.time)} · {r.items.length} items · nag: {NAG_LEVELS[r.nag].label.toLowerCase()}
              </span>
            </span>
            {state.settings.areas.length > 1 && (
              <span className={`chip ${AREAS[r.area].chip}`}>{AREAS[r.area].emoji}</span>
            )}
          </button>
        ))}
        {routines.length === 0 && !editing && (
          <p className="text-center text-zinc-500 py-12">No routines yet. Create your first one 👆</p>
        )}
      </div>
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
    <div className="card mb-4 flex flex-col gap-4 !border-violet-400/30">
      <div className="flex gap-2">
        <select className="input w-16 text-center" value={r.emoji} onChange={(e) => set({ emoji: e.target.value })} aria-label="Icon">
          {EMOJIS.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Name, e.g. Pack your gym bag"
          value={r.name}
          onChange={(e) => set({ name: e.target.value })}
          autoFocus
        />
      </div>

      {state.settings.areas.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {state.settings.areas.map((a) => (
            <button key={a} type="button" className={`seg ${r.area === a ? "seg-on" : ""}`} onClick={() => set({ area: a })}>
              {AREAS[a].emoji} {AREAS[a].label}
            </button>
          ))}
        </div>
      )}

      <div>
        <label className="label">Days</label>
        <div className="flex gap-1.5">
          {DAY_ORDER.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => set({ days: r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d] })}
              className={`seg flex-1 px-0 text-xs ${r.days.includes(d) ? "seg-on" : ""}`}
            >
              {WEEKDAYS_SHORT[d]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Time</label>
          <input type="time" className="input" value={r.time} onChange={(e) => set({ time: e.target.value })} />
        </div>
        <div>
          <label className="label">Nag level</label>
          <select className="input" value={r.nag} onChange={(e) => set({ nag: e.target.value as NagLevel })}>
            {(Object.keys(NAG_LEVELS) as NagLevel[]).map((n) => (
              <option key={n} value={n}>
                {NAG_LEVELS[n].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Items on the list</label>
        <ul className="flex flex-col gap-1 mb-2">
          {r.items.map((item) => (
            <li key={item.id} className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-1.5">
              <span className="flex-1 text-sm">{item.text}</span>
              <button
                className="btn-ghost text-xs"
                onClick={() => set({ items: r.items.filter((i) => i.id !== item.id) })}
                aria-label={`Remove ${item.text}`}
              >
                ✕
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
          <input className="input" placeholder="Add an item…" value={newItem} onChange={(e) => setNewItem(e.target.value)} />
          <button className="btn-secondary" disabled={!newItem.trim()}>
            Add
          </button>
        </form>
      </div>

      <div className="flex items-center gap-2">
        {onDelete && (
          <button className="btn-ghost !text-rose-300" onClick={onDelete}>
            Delete
          </button>
        )}
        <div className="flex-1" />
        <button className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="btn-primary"
          disabled={!r.name.trim() || r.days.length === 0 || r.items.length === 0}
          onClick={() => onSave({ ...r, name: r.name.trim() })}
        >
          Save
        </button>
      </div>
    </div>
  );
}
