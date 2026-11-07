"use client";

import { useState } from "react";
import { ChecklistCard } from "@/components/ChecklistCard";
import { schoolPackFor } from "@/lib/checklists";
import { addDays, WEEKDAYS_SHORT } from "@/lib/dates";
import { uid } from "@/lib/defaults";
import { useNow, useStore } from "@/lib/store";
import type { Subject } from "@/lib/types";

const SCHOOL_DAYS = [1, 2, 3, 4, 5];

export default function SchoolPage() {
  const { state, updateSchool } = useStore();
  const now = useNow();
  const { school } = state;
  const [newSubject, setNewSubject] = useState("");

  if (!state.settings.areas.includes("skola")) {
    return <p className="text-ink-2">Turn on the School area in Settings to use the schedule.</p>;
  }

  // Next school day with classes, for the preview
  let preview = null;
  for (let i = 1; i <= 7 && !preview; i++) preview = schoolPackFor(state, addDays(now, i));

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    updateSchool({ subjects: school.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const removeSubject = (id: string) => {
    const schedule = Object.fromEntries(Object.entries(school.schedule).map(([d, ids]) => [d, ids.filter((x) => x !== id)]));
    updateSchool({ subjects: school.subjects.filter((s) => s.id !== id), schedule });
  };

  const toggleDay = (day: number, subjectId: string) => {
    const cur = school.schedule[day] ?? [];
    updateSchool({
      schedule: { ...school.schedule, [day]: cur.includes(subjectId) ? cur.filter((x) => x !== subjectId) : [...cur, subjectId] },
    });
  };

  return (
    <div>
      <p className="eyebrow">School</p>
      <h1 className="display mt-3 text-[clamp(3.5rem,10vw,6.5rem)]">Pack once. Think less.</h1>
      <p className="mt-4 mb-4 max-w-lg text-ink-2">
        Fill in your schedule once. You&apos;ll get a packing list every evening for the next day, plus a check in the morning
        before you leave.
      </p>

      <h2 className="section-title">Reminder times</h2>
      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="label">Pack your bag (night before)</label>
          <input type="time" className="input" value={school.packTime} onChange={(e) => updateSchool({ packTime: e.target.value })} />
        </div>
        <div>
          <label className="label">Morning check</label>
          <input type="time" className="input" value={school.morningTime} onChange={(e) => updateSchool({ morningTime: e.target.value })} />
        </div>
      </div>

      <h2 className="section-title">Weekly schedule</h2>
      <p className="-mt-1 mb-3 text-xs text-ink-2">Tap to choose which subjects you have each day.</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line">
              <th className="p-3 text-left text-xs font-medium text-ink-2">Subject</th>
              {SCHOOL_DAYS.map((d) => (
                <th key={d} className="w-12 p-2 text-xs font-medium text-ink-2">
                  {WEEKDAYS_SHORT[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {school.subjects.map((s) => (
              <tr key={s.id} className="border-b border-line last:border-0">
                <td className="p-3 font-medium whitespace-nowrap">{s.name}</td>
                {SCHOOL_DAYS.map((d) => {
                  const on = (school.schedule[d] ?? []).includes(s.id);
                  return (
                    <td key={d} className="p-1 text-center">
                      <button
                        onClick={() => toggleDay(d, s.id)}
                        className={`h-8 w-8 rounded-md border transition-colors ${
                          on ? "border-ink bg-ink" : "border-line bg-surface hover:border-ink/40"
                        }`}
                        aria-label={`${s.name} ${WEEKDAYS_SHORT[d]}`}
                        aria-pressed={on}
                      >
                        {on && (
                          <svg viewBox="0 0 12 12" className="mx-auto h-3 w-3 text-white" aria-hidden>
                            <path d="M2.5 6.2 5 8.5l4.5-5" fill="none" stroke="currentColor" strokeWidth="1.6" />
                          </svg>
                        )}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="section-title">Subjects and what to bring</h2>
      <div className="flex flex-col gap-2">
        {school.subjects.map((s) => (
          <SubjectEditor key={s.id} subject={s} onChange={(p) => updateSubject(s.id, p)} onRemove={() => removeSubject(s.id)} />
        ))}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = newSubject.trim();
            if (!name) return;
            updateSchool({ subjects: [...school.subjects, { id: uid(), name, items: [] }] });
            setNewSubject("");
          }}
        >
          <input className="input" placeholder="New subject, e.g. Music" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <button className="btn-secondary" disabled={!newSubject.trim()}>
            Add
          </button>
        </form>
      </div>

      {preview && (
        <>
          <h2 className="section-title">Preview</h2>
          <ChecklistCard list={preview} subtitle="This is what your packing list looks like" />
        </>
      )}
    </div>
  );
}

function SubjectEditor({ subject, onChange, onRemove }: { subject: Subject; onChange: (p: Partial<Subject>) => void; onRemove: () => void }) {
  const [item, setItem] = useState("");
  return (
    <div className="card py-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          className="flex-1 bg-transparent font-medium outline-none focus:underline decoration-accent-ink"
          value={subject.name}
          onChange={(e) => onChange({ name: e.target.value })}
          aria-label="Subject name"
        />
        <button className="btn-ghost text-xs" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {subject.items.map((it) => (
          <span key={it} className="inline-flex items-center gap-1.5 rounded-md bg-bg-2 px-2 py-1 text-xs">
            {it}
            <button
              onClick={() => onChange({ items: subject.items.filter((x) => x !== it) })}
              aria-label={`Remove ${it}`}
              className="text-ink-2 hover:text-ink"
            >
              <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" aria-hidden>
                <path d="M2 2l6 6M8 2 2 8" stroke="currentColor" strokeWidth="1.4" />
              </svg>
            </button>
          </span>
        ))}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const t = item.trim();
            if (t && !subject.items.includes(t)) onChange({ items: [...subject.items, t] });
            setItem("");
          }}
        >
          <input
            className="w-36 border-b border-dashed border-line bg-transparent py-0.5 text-xs outline-none placeholder:text-ink-2/70 focus:border-ink"
            placeholder="Add item to bring"
            aria-label={`Add item for ${subject.name}`}
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
}
