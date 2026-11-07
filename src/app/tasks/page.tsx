"use client";

import { useState } from "react";
import { AreaFilter, type AreaFilterValue } from "@/components/AreaFilter";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderRow } from "@/components/ReminderRow";
import { addDays, isSameDay, startOfDay } from "@/lib/dates";
import { useNow, useStore } from "@/lib/store";
import type { Reminder } from "@/lib/types";

export default function RemindersPage() {
  const { state, addReminder } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState<AreaFilterValue>("alla");
  const [showDone, setShowDone] = useState(false);

  const visible = state.reminders.filter(
    (r) => state.settings.areas.includes(r.area) && (filter === "alla" || r.area === filter),
  );
  const active = visible.filter((r) => !r.done).sort((a, b) => a.due.localeCompare(b.due));
  const done = visible
    .filter((r) => r.done)
    .sort((a, b) => (b.doneAt ?? "").localeCompare(a.doneAt ?? ""));

  const tomorrow = addDays(now, 1);
  const weekEnd = addDays(startOfDay(now), 7);
  const groups: { title: string; items: Reminder[] }[] = [
    { title: "Overdue", items: active.filter((r) => new Date(r.due) <= now) },
    { title: "Today", items: active.filter((r) => new Date(r.due) > now && isSameDay(new Date(r.due), now)) },
    { title: "Tomorrow", items: active.filter((r) => isSameDay(new Date(r.due), tomorrow)) },
    {
      title: "This week",
      items: active.filter((r) => new Date(r.due) >= addDays(startOfDay(now), 2) && new Date(r.due) < weekEnd),
    },
    { title: "Later", items: active.filter((r) => new Date(r.due) >= weekEnd) },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold tracking-tight mb-5">Tasks</h1>
      <div className="card mb-4">
        <ReminderForm compact defaultArea={filter === "alla" ? undefined : filter} onSubmit={addReminder} />
      </div>
      <AreaFilter value={filter} onChange={setFilter} />

      {active.length === 0 && (
        <p className="text-center text-zinc-500 py-12">No active reminders. Add one above 👆</p>
      )}

      {groups
        .filter((g) => g.items.length > 0)
        .map((g) => (
          <section key={g.title}>
            <h2 className={`section-title ${g.title === "Overdue" ? "!text-rose-300" : ""}`}>
              {g.title} ({g.items.length})
            </h2>
            <ul className="flex flex-col gap-2">
              {g.items.map((r) => (
                <ReminderRow key={r.id} r={r} now={now} />
              ))}
            </ul>
          </section>
        ))}

      {done.length > 0 && (
        <section>
          <button className="section-title hover:text-zinc-200" onClick={() => setShowDone((s) => !s)}>
            {showDone ? "▾" : "▸"} Completed ({done.length})
          </button>
          {showDone && (
            <ul className="flex flex-col gap-2">
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
