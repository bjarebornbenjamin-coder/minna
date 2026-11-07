"use client";

import { useState } from "react";
import { AREAS, NAG_LEVELS, REPEATS } from "@/lib/areas";
import { formatDue } from "@/lib/dates";
import { describeNext, nextNagAt } from "@/lib/nag";
import { useStore } from "@/lib/store";
import type { Reminder } from "@/lib/types";
import { ReminderForm } from "./ReminderForm";

export function ReminderRow({ r, now }: { r: Reminder; now: Date }) {
  const { completeReminder, deleteReminder, updateReminder, snoozeReminder, state } = useStore();
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const overdue = !r.done && new Date(r.due) <= now;
  const showArea = state.settings.areas.length > 1;

  if (editing) {
    return (
      <li className="card">
        <ReminderForm
          initial={r}
          submitLabel="Save"
          onSubmit={(patch) => {
            updateReminder(r.id, patch);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const next =
    overdue && r.nag !== "av"
      ? nextNagAt({
          level: r.nag,
          start: new Date(r.due),
          nagCount: r.nagCount,
          lastNotifiedAt: r.lastNotifiedAt,
          snoozedUntil: r.snoozedUntil,
        })
      : null;
  const nextText = describeNext(next, now);

  return (
    <li
      className={`card flex items-start gap-3 py-3 animate-fadeup ${r.done ? "opacity-50" : ""} ${
        overdue ? "!border-rose-400/30 !bg-rose-500/[0.06] shadow-[0_0_30px_-15px_rgba(244,63,94,0.8)]" : ""
      }`}
    >
      <button
        onClick={() => completeReminder(r.id)}
        className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 grid place-items-center transition ${
          r.done
            ? "bg-gradient-to-br from-violet-500 to-cyan-400 border-transparent text-white shadow-[0_0_14px_rgba(139,92,246,0.8)]"
            : "border-zinc-600 hover:border-cyan-300 hover:shadow-[0_0_12px_rgba(34,211,238,0.6)]"
        }`}
        aria-label={r.done ? "Mark as not done" : "Mark as done"}
      >
        {r.done && <span className="text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-snug ${r.done ? "line-through" : ""}`}>{r.title}</p>
        {r.notes && <p className="text-sm text-zinc-400 mt-0.5 whitespace-pre-wrap">{r.notes}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs">
          <span className={overdue ? "text-rose-300 font-medium" : "text-zinc-400"}>
            {overdue ? "⏰ " : ""}
            {formatDue(r.due, now)}
          </span>
          {showArea && (
            <span className={`chip ${AREAS[r.area].chip}`}>
              {AREAS[r.area].emoji} {AREAS[r.area].label}
            </span>
          )}
          {r.repeat !== "ingen" && <span className="text-zinc-500">🔁 {REPEATS[r.repeat]}</span>}
          {r.nag === "mamma" && <span className="text-zinc-500">📣 {NAG_LEVELS.mamma.label}</span>}
          {nextText && !r.done && <span className="text-zinc-500">· nags again {nextText}</span>}
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} className="btn-ghost" aria-label="More options">
          ⋯
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-8 z-20 w-48 rounded-2xl bg-[#0d1022]/95 backdrop-blur-xl shadow-2xl border border-white/10 py-1 text-sm">
              {!r.done && (
                <>
                  <MenuItem onClick={() => (snoozeReminder(r.id, 10), setMenu(false))}>⏰ Snooze 10 min</MenuItem>
                  <MenuItem onClick={() => (snoozeReminder(r.id, 60), setMenu(false))}>⏰ Snooze 1 hour</MenuItem>
                </>
              )}
              <MenuItem onClick={() => (setEditing(true), setMenu(false))}>✏️ Edit</MenuItem>
              <MenuItem danger onClick={() => deleteReminder(r.id)}>
                🗑️ Delete
              </MenuItem>
            </div>
          </>
        )}
      </div>
    </li>
  );
}

function MenuItem({ children, onClick, danger }: { children: React.ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 hover:bg-white/[0.06] ${danger ? "text-rose-300" : "text-zinc-200"}`}
    >
      {children}
    </button>
  );
}
