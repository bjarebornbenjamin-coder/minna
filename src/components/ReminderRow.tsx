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
          submitLabel="Spara"
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
      className={`card flex items-start gap-3 py-3 ${r.done ? "opacity-60" : ""} ${
        overdue ? "border-rose-300 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20" : ""
      }`}
    >
      <button
        onClick={() => completeReminder(r.id)}
        className={`mt-0.5 h-6 w-6 shrink-0 rounded-full border-2 grid place-items-center transition ${
          r.done
            ? "bg-violet-600 border-violet-600 text-white"
            : "border-zinc-300 dark:border-zinc-600 hover:border-violet-500"
        }`}
        aria-label={r.done ? "Markera som ej klar" : "Markera som klar"}
      >
        {r.done && <span className="text-xs">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium leading-snug ${r.done ? "line-through" : ""}`}>{r.title}</p>
        {r.notes && <p className="text-sm text-zinc-500 mt-0.5 whitespace-pre-wrap">{r.notes}</p>}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs">
          <span className={overdue ? "text-rose-600 dark:text-rose-400 font-medium" : "text-zinc-500"}>
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
          {nextText && !r.done && <span className="text-zinc-400">· tjatar igen {nextText}</span>}
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} className="btn-ghost" aria-label="Fler val">
          ⋯
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-8 z-20 w-44 rounded-xl bg-white dark:bg-zinc-900 shadow-lg border border-zinc-200 dark:border-zinc-800 py-1 text-sm">
              {!r.done && (
                <>
                  <MenuItem onClick={() => (snoozeReminder(r.id, 10), setMenu(false))}>⏰ Snooza 10 min</MenuItem>
                  <MenuItem onClick={() => (snoozeReminder(r.id, 60), setMenu(false))}>⏰ Snooza 1 timme</MenuItem>
                </>
              )}
              <MenuItem onClick={() => (setEditing(true), setMenu(false))}>✏️ Redigera</MenuItem>
              <MenuItem danger onClick={() => deleteReminder(r.id)}>
                🗑️ Ta bort
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
      className={`w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 ${danger ? "text-rose-600" : ""}`}
    >
      {children}
    </button>
  );
}
