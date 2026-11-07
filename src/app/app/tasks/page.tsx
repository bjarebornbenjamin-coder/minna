"use client";

import { useState } from "react";
import { AreaFilter, type AreaFilterValue } from "@/components/AreaFilter";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderRow } from "@/components/ReminderRow";
import { addDays, isSameDay, startOfDay } from "@/lib/dates";
import { useNow, useStore } from "@/lib/store";
import type { Reminder } from "@/lib/types";

export default function TasksPage() {
  const { state, addReminder } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState<AreaFilterValue>("alla");
  const [showDone, setShowDone] = useState(false);

  const visible = state.reminders.filter((r) => state.settings.areas.includes(r.area) && (filter === "alla" || r.area === filter));
  const active = visible.filter((r) => !r.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = visible.filter((r) => r.done).sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));

  const tomorrow = addDays(now, 1);
  const weekEnd = addDays(startOfDay(now), 7);
  const groups: { title: string; items: Reminder[] }[] = [
    { title: "Overdue", items: active.filter((r) => new Date(r.due) <= now) },
    { title: "Today", items: active.filter((r) => new Date(r.due) > now && isSameDay(new Date(r.due), now)) },
    { title: "Tomorrow", items: active.filter((r) => isSameDay(new Date(r.due), tomorrow)) },
    { title: "This week", items: active.filter((r) => new Date(r.due) >= addDays(startOfDay(now), 2) && new Date(r.due) < weekEnd) },
    { title: "Later", items: active.filter((r) => new Date(r.due) >= weekEnd) },
  ];

  return (
    <div>
      <p className="eyebrow">Tasks</p>
      <h1 className="display mt-3 mb-8 text-[clamp(3.5rem,10vw,6.5rem)]">Everything ahead.</h1>
      <div className="card mb-8">
        <ReminderForm compact defaultArea={filter === "alla" ? undefined : filter} onSubmit={addReminder} />
      </div>
      <AreaFilter value={filter} onChange={setFilter} />

      {active.length === 0 && <p className="py-16 text-center text-ink-2">No active reminders. Add one above.</p>}

      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.title}>
            <h2 className="section-title flex justify-between">
              <span>{g.title}</span>
              <span className="tabular-nums">{g.items.length}</span>
            </h2>
            <ul>
              {g.items.map((r) => (
                <ReminderRow key={r.id} r={r} now={now} />
              ))}
            </ul>
          </section>
        ))}

      {done.length > 0 && (
        <section className="mt-10">
          <button className="btn-ghost -ml-2" aria-expanded={showDone} onClick={() => setShowDone((s) => !s)}>
            {showDone ? "Hide" : "Show"} completed ({done.length})
          </button>
          {showDone && (
            <ul className="mt-2">
              {done.slice(0, 50).map((r) => (
                <ReminderRow key={r.id} r={r} now={now} />
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
