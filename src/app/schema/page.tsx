"use client";

import { useState } from "react";
import { ChecklistCard } from "@/components/ChecklistCard";
import { schoolPackFor } from "@/lib/checklists";
import { addDays, WEEKDAYS } from "@/lib/dates";
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
    return <p className="text-zinc-500">Slå på området Skola under Inställningar för att använda schemat.</p>;
  }

  // Nästa skoldag med lektioner, för förhandsvisning
  let preview = null;
  for (let i = 1; i <= 7 && !preview; i++) preview = schoolPackFor(state, addDays(now, i));

  const updateSubject = (id: string, patch: Partial<Subject>) =>
    updateSchool({ subjects: school.subjects.map((s) => (s.id === id ? { ...s, ...patch } : s)) });

  const removeSubject = (id: string) => {
    const schedule = Object.fromEntries(
      Object.entries(school.schedule).map(([d, ids]) => [d, ids.filter((x) => x !== id)]),
    );
    updateSchool({ subjects: school.subjects.filter((s) => s.id !== id), schedule });
  };

  const toggleDay = (day: number, subjectId: string) => {
    const cur = school.schedule[day] ?? [];
    updateSchool({
      schedule: {
        ...school.schedule,
        [day]: cur.includes(subjectId) ? cur.filter((x) => x !== subjectId) : [...cur, subjectId],
      },
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-1">Skola 🎒</h1>
      <p className="text-sm text-zinc-500 mb-4">
        Fyll i schemat en gång. Sedan får du en packlista varje kväll för nästa dag, och en koll på morgonen innan du
        går.
      </p>

      <h2 className="section-title">Påminnelsetider</h2>
      <div className="card grid grid-cols-2 gap-3">
        <div>
          <label className="label">Packa väskan (kvällen innan)</label>
          <input type="time" className="input" value={school.packTime} onChange={(e) => updateSchool({ packTime: e.target.value })} />
        </div>
        <div>
          <label className="label">Morgonkoll</label>
          <input
            type="time"
            className="input"
            value={school.morningTime}
            onChange={(e) => updateSchool({ morningTime: e.target.value })}
          />
        </div>
      </div>

      <h2 className="section-title">Veckoschema</h2>
      <p className="text-xs text-zinc-500 -mt-1 mb-2">Tryck för att välja vilka ämnen du har varje dag.</p>
      <div className="card overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="text-left font-medium p-3">Ämne</th>
              {SCHOOL_DAYS.map((d) => (
                <th key={d} className="font-medium p-2 w-12">
                  {WEEKDAYS[d].slice(0, 3)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {school.subjects.map((s) => (
              <tr key={s.id} className="border-b last:border-0 border-zinc-100 dark:border-zinc-800/60">
                <td className="p-3 font-medium whitespace-nowrap">{s.name}</td>
                {SCHOOL_DAYS.map((d) => {
                  const on = (school.schedule[d] ?? []).includes(s.id);
                  return (
                    <td key={d} className="p-1 text-center">
                      <button
                        onClick={() => toggleDay(d, s.id)}
                        className={`h-8 w-8 rounded-lg transition ${
                          on ? "bg-amber-400 text-amber-950" : "bg-zinc-100 dark:bg-zinc-800 text-transparent hover:text-zinc-400"
                        }`}
                        aria-label={`${s.name} ${WEEKDAYS[d]}`}
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

      <h2 className="section-title">Ämnen och vad som ska med</h2>
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
          <input className="input" placeholder="Nytt ämne, t.ex. Slöjd" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} />
          <button className="btn-secondary" disabled={!newSubject.trim()}>
            Lägg till
          </button>
        </form>
      </div>

      {preview && (
        <>
          <h2 className="section-title">Förhandsvisning</h2>
          <ChecklistCard list={preview} subtitle="Så här ser packlistan ut" />
        </>
      )}
    </div>
  );
}

function SubjectEditor({
  subject,
  onChange,
  onRemove,
}: {
  subject: Subject;
  onChange: (p: Partial<Subject>) => void;
  onRemove: () => void;
}) {
  const [item, setItem] = useState("");
  return (
    <div className="card py-3">
      <div className="flex items-center gap-2 mb-2">
        <input
          className="font-medium bg-transparent outline-none flex-1 focus:underline"
          value={subject.name}
          onChange={(e) => onChange({ name: e.target.value })}
          aria-label="Ämnesnamn"
        />
        <button className="btn-ghost text-xs text-rose-600" onClick={onRemove}>
          Ta bort
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {subject.items.map((it) => (
          <span key={it} className="chip bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
            {it}
            <button onClick={() => onChange({ items: subject.items.filter((x) => x !== it) })} aria-label={`Ta bort ${it}`}>
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
            className="text-xs bg-transparent outline-none border-b border-dashed border-zinc-300 dark:border-zinc-700 w-32 py-0.5"
            placeholder="+ sak att ta med"
            value={item}
            onChange={(e) => setItem(e.target.value)}
          />
        </form>
      </div>
    </div>
  );
}
