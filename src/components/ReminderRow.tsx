"use client";

import { useState } from "react";
import { NAG_LEVELS, REPEATS } from "@/lib/areas";
import { formatDue } from "@/lib/dates";
import { describeNext, nextNagAt } from "@/lib/nag";
import { useStore } from "@/lib/store";
import type { Reminder } from "@/lib/types";
import { AreaTag } from "./AreaTag";
import { ReminderForm } from "./ReminderForm";

export function ReminderRow({ r, now }: { r: Reminder; now: Date }) {
  const { completeReminder, deleteReminder, updateReminder, snoozeReminder, state } = useStore();
  const [editing, setEditing] = useState(false);
  const [menu, setMenu] = useState(false);
  const overdue = !r.done && new Date(r.due) <= now;
  const mom = r.nag === "mamma";

  if (editing) {
    return (
      <li className="border-b border-line py-4">
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
      ? nextNagAt({ level: r.nag, start: new Date(r.due), nagCount: r.nagCount, lastNotifiedAt: r.lastNotifiedAt, snoozedUntil: r.snoozedUntil })
      : null;
  const nextText = describeNext(next, now);

  return (
    <li className={`group relative flex items-start gap-3 border-b border-line py-3.5 ${r.done ? "opacity-50" : ""}`}>
      {overdue && <span aria-hidden className={`absolute -left-3 top-4 bottom-4 w-0.5 ${mom ? "bg-amber" : "bg-vermilion"}`} />}
      <button
        onClick={() => completeReminder(r.id)}
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${
          r.done ? "border-ink bg-ink text-white" : "border-ink-2/50 hover:border-ink"
        }`}
        aria-label={r.done ? `Mark “${r.title}” as not done` : `Mark “${r.title}” as done`}
      >
        {r.done && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
            <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`leading-snug ${r.done ? "line-through" : ""}`}>{r.title}</p>
        {r.notes && <p className="mt-0.5 whitespace-pre-wrap text-sm text-ink-2">{r.notes}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-2">
          <span className={overdue ? "font-medium text-ink" : ""}>{formatDue(r.due, now)}</span>
          {state.settings.areas.length > 1 && <AreaTag area={r.area} />}
          {r.repeat !== "ingen" && <span>{REPEATS[r.repeat]}</span>}
          {mom && <span className="font-medium text-[#9a6a12]">{NAG_LEVELS.mamma.label}</span>}
          {nextText && !r.done && <span>Next reminder {nextText}</span>}
        </div>
      </div>

      <div className="relative">
        <button onClick={() => setMenu((m) => !m)} className="btn-ghost !px-2 text-xs" aria-label="More options" aria-expanded={menu}>
          Edit
        </button>
        {menu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenu(false)} />
            <div className="absolute right-0 top-8 z-20 w-44 rounded-md border border-line bg-surface py-1 text-sm shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]">
              {!r.done && (
                <>
                  <MenuItem onClick={() => (snoozeReminder(r.id, 10), setMenu(false))}>Snooze 10 min</MenuItem>
                  <MenuItem onClick={() => (snoozeReminder(r.id, 60), setMenu(false))}>Snooze 1 hour</MenuItem>
                  <MenuItem onClick={() => (updateReminder(r.id, { nag: mom ? "normal" : "mamma" }), setMenu(false))}>
                    {mom ? "Turn off Mom Mode" : "Turn on Mom Mode"}
                  </MenuItem>
                </>
              )}
              <MenuItem onClick={() => (setEditing(true), setMenu(false))}>Edit details</MenuItem>
              <MenuItem danger onClick={() => deleteReminder(r.id)}>
                Delete
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
    <button onClick={onClick} className={`w-full px-3 py-2 text-left hover:bg-bg ${danger ? "text-[#b42318]" : ""}`}>
      {children}
    </button>
  );
}
