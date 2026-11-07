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
  const tomorrowMorning = atTime(addDays(now, 1), "07:30");
  const tomorrowWork = atTime(addDays(now, 1), "09:00");
  const opts = [{ label: "Om 1 h", date: inHour }];
  if (tonight > now) opts.push({ label: "Ikväll 19", date: tonight });
  opts.push({ label: "Imorgon 07:30", date: tomorrowMorning }, { label: "Imorgon 09", date: tomorrowWork });
  return opts;
}

export function ReminderForm({
  initial,
  defaultArea,
  submitLabel = "Lägg till",
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
  const [due, setDue] = useState(() =>
    toLocalInput(initial?.due ? new Date(initial.due) : new Date(Date.now() + 60 * 60000)),
  );
  const [repeat, setRepeat] = useState<Repeat>(initial?.repeat ?? "ingen");
  const [nag, setNag] = useState<NagLevel>(initial?.nag ?? "normal");
  const [expanded, setExpanded] = useState(!compact);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit({
      title: title.trim(),
      notes: notes.trim() || undefined,
      area,
      due: new Date(due).toISOString(),
      repeat,
      nag,
    });
    if (!initial) {
      setTitle("");
      setNotes("");
      setExpanded(!compact);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div className="flex gap-2">
        <input
          className="input"
          placeholder="Vad ska du komma ihåg?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
          aria-label="Påminnelse"
        />
        <button className="btn-primary shrink-0" disabled={!title.trim()}>
          {submitLabel}
        </button>
      </div>

      {expanded && (
        <>
          {areas.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setArea(a)}
                  className={`seg ${area === a ? "seg-on" : ""}`}
                >
                  {AREAS[a].emoji} {AREAS[a].label}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {quickTimes(new Date()).map((q) => (
              <button
                type="button"
                key={q.label}
                onClick={() => setDue(toLocalInput(q.date))}
                className={`seg text-xs ${due === toLocalInput(q.date) ? "seg-on" : ""}`}
              >
                {q.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="label">När</label>
              <input type="datetime-local" className="input" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <div>
              <label className="label">Upprepa</label>
              <select className="input" value={repeat} onChange={(e) => setRepeat(e.target.value as Repeat)}>
                {(Object.keys(REPEATS) as Repeat[]).map((r) => (
                  <option key={r} value={r}>
                    {REPEATS[r]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tjat-nivå</label>
              <select className="input" value={nag} onChange={(e) => setNag(e.target.value as NagLevel)}>
                {(Object.keys(NAG_LEVELS) as NagLevel[]).map((n) => (
                  <option key={n} value={n}>
                    {NAG_LEVELS[n].label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-xs text-zinc-500 -mt-1">{NAG_LEVELS[nag].desc}</p>

          <textarea
            className="input min-h-[60px]"
            placeholder="Anteckning (valfritt)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {onCancel && (
            <div className="flex justify-end">
              <button type="button" className="btn-ghost" onClick={onCancel}>
                Avbryt
              </button>
            </div>
          )}
        </>
      )}
    </form>
  );
}
