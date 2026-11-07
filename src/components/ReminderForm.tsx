"use client";

import { useState } from "react";
import { AREAS, NAG_LEVELS, REPEATS } from "@/lib/areas";
import { addDays, atTime, toLocalInput } from "@/lib/dates";
import type { NewReminder } from "@/lib/store";
import { useStore } from "@/lib/store";
import type { AreaId, NagLevel, Repeat } from "@/lib/types";

function quickTimes(now: Date): { label: string; date: Date }[] {
  const inHour = new Date(now.getTime() + 60 * 60000);
  inHour.setSeconds(0, 0);
  const tonight = atTime(now, "19:00");
  const opts = [{ label: "In 1 hour", date: inHour }];
  if (tonight > now) opts.push({ label: "Tonight, 7 PM", date: tonight });
  opts.push(
    { label: "Tomorrow, 7:30 AM", date: atTime(addDays(now, 1), "07:30") },
    { label: "Tomorrow, 9 AM", date: atTime(addDays(now, 1), "09:00") },
  );
  return opts;
}

export function ReminderForm({
  initial,
  defaultArea,
  submitLabel = "Add",
  onSubmit,
  onCancel,
  compact = false,
}: {
  initial?: Partial<NewReminder>;
  defaultArea?: AreaId;
  submitLabel?: string;
  onSubmit: (r: NewReminder) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const { state } = useStore();
  const areas = state.settings.areas;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [area, setArea] = useState<AreaId>(initial?.area ?? defaultArea ?? areas[0] ?? "privat");
  const [due, setDue] = useState(() => toLocalInput(initial?.due ? new Date(initial.due) : new Date(Date.now() + 60 * 60000)));
  const [repeat, setRepeat] = useState<Repeat>(initial?.repeat ?? "ingen");
  const [nag, setNag] = useState<NagLevel>(initial?.nag ?? "normal");
  const [expanded, setExpanded] = useState(!compact);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), notes: notes.trim() || undefined, area, due: new Date(due).toISOString(), repeat, nag });
    if (!initial) {
      setTitle("");
      setNotes("");
      setExpanded(!compact);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="What do you need to remember?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          aria-label="Reminder"
        />
        <button className="btn-primary shrink-0" disabled={!title.trim()}>
          {submitLabel}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-4 animate-fade">
          {areas.length > 1 && (
            <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Area">
              {areas.map((a) => (
                <button
                  type="button"
                  key={a}
                  role="radio"
                  aria-checked={area === a}
                  onClick={() => setArea(a)}
                  className={`seg ${area === a ? "seg-on" : ""}`}
                >
                  {AREAS[a].label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {quickTimes(new Date()).map((q) => (
              <button
                type="button"
                key={q.label}
                onClick={() => setDue(toLocalInput(q.date))}
                className={`seg !text-xs ${due === toLocalInput(q.date) ? "seg-on" : ""}`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="label" htmlFor="rf-due">
                When
              </label>
              <input id="rf-due" type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="rf-repeat">
                Repeat
              </label>
              <select id="rf-repeat" className="input" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
                {(Object.keys(REPEATS) as Repeat[]).map((r) => (
                  <option key={r} value={r}>
                    {REPEATS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="rf-nag">
                Reminders
              </label>
              <select id="rf-nag" className="input" value={nag} onChange={(e) => setNag(e.target.value as NagLevel)}>
                {(Object.keys(NAG_LEVELS) as NagLevel[]).map((n) => (
                  <option key={n} value={n}>
                    {NAG_LEVELS[n].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="-mt-2 text-xs text-ink-2">{NAG_LEVELS[nag].desc}</p>

          <textarea
            className="input min-h-[64px]"
            placeholder="Note (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            aria-label="Note"
          />

          {onCancel && (
            <div className="flex justify-end">
              <button type="button" className="btn-ghost" onClick={onCancel}>
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
