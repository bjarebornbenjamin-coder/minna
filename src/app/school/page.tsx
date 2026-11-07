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
    return <p className="text-zinc-400">Turn on the School area in Settings to use the schedule.</p>;
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
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-1">School</h1>
      <p className="text-sm text-zinc-400 mb-4">
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
      <p className="text-xs text-zinc-500 -mt-1 mb-2">Tap to choose which subjects you have each day.</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left font-medium text-zinc-400 p-3">Subject</th>
              {SCHOOL_DAYS.map((d) => (
                <th key={d} className="font-medium text-zinc-400 p-2 w-12">
                  {WEEKDAYS_SHORT[d]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {school.subjects.map((s) => (
              <tr key={s.id} className="border-b last:border-0 border-white/[0.04]">
                <td className="p-3 font-medium whitespace-nowrap">{s.name}</td>
                {SCHOOL_DAYS.map((d) => {
                  const on = (school.schedule[d] ?? []).includes(s.id);
                  return (
                    <td key={d} className="p-1 text-center">
                      <button
                        onClick={() => toggleDay(d, s.id)}
                        className={`h-8 w-8 rounded-xl transition ${
                          on
                            ? "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950 shadow-[0_0_16px_-2px_rgba(251,191,36,0.7)]"
                            : "bg-white/[0.04] text-transparent hover:text-zinc-500 hover:bg-white/[0.08]"
                        }`}
                        aria-label={`${s.name} ${WEEKDAYS_SHORT[d]}`}
                        aria-pressed={on}
                      >
                        ✓
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
          className="font-medium bg-transparent outline-none flex-1 focus:underline decoration-violet-400"
          value={subject.name}
          onChange={(e) => onChange({ name: e.target.value })}
          aria-label="Subject name"
        />
        <button className="btn-ghost text-xs !text-rose-300" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {subject.items.map((it) => (
          <span key={it} className="chip bg-amber-400/10 text-amber-200 ring-1 ring-amber-400/20">
            {it}
            <button onClick={() => onChange({ items: subject.items.filter((x) => x !== it) })} aria-label={`Remove ${it}`}>
              ✕
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
            className="text-xs bg-transparent outline-none border-b border-dashed border-white/20 w-32 py-0.5 placeholder:text-zinc-500"
            placeholder="+ add item to bring"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
}
