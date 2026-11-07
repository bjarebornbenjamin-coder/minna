"use client";

import { useState } from "react";
import { AreaFilter, type AreaFilterValue } from "@/components/AreaFilter";
import { ChecklistCard } from "@/components/ChecklistCard";
import { NotificationBanner } from "@/components/NotificationBanner";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderRow } from "@/components/ReminderRow";
import { remainingItems, routinesFor, schoolPackFor } from "@/lib/checklists";
import { addDays, formatTime, isSameDay } from "@/lib/dates";
import { greeting } from "@/lib/messages";
import { useNow, useStore } from "@/lib/store";

export default function TodayPage() {
  const { state, addReminder } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState<AreaFilterValue>("alla");
  const { settings } = state;

  const inFilter = (area: string) => settings.areas.includes(area as never) && (filter === "alla" || filter === area);
  const tomorrow = addDays(now, 1);

  const active = state.reminders
    .filter((r) => !r.done && inFilter(r.area))
    .sort((a, b) => a.due.localeCompare(b.due));
  const overdue = active.filter((r) => new Date(r.due) <= now);
  const laterToday = active.filter((r) => new Date(r.due) > now && isSameDay(new Date(r.due), now));
  const tomorrowList = active.filter((r) => isSameDay(new Date(r.due), tomorrow));
  const doneToday = state.reminders.filter(
    (r) => r.done && r.doneAt && isSameDay(new Date(r.doneAt), now) && inFilter(r.area),
  );

  // Skolans packlista: dagens på förmiddagen, morgondagens från lunch
  const pack = now.getHours() < 12 ? schoolPackFor(state, now) : schoolPackFor(state, tomorrow);
  const lists = [
    ...routinesFor(state, now),
    ...(pack ? [pack] : []),
  ].filter((l) => inFilter(l.area));

  const openLists = lists.filter((l) => remainingItems(state, l).length > 0).length;
  const todo = overdue.length + laterToday.length + openLists;

  return (
    <div>
      <header className="mb-5">
        <p className="text-sm text-zinc-500 first-letter:uppercase">
          {now.toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" })}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">{greeting(now, settings.name)}</h1>
        <p className="text-zinc-500 mt-1">
          {todo === 0
            ? "Inget som väntar just nu. Snyggt! ✨"
            : `Du har ${todo} ${todo === 1 ? "sak" : "saker"} att hålla koll på idag.`}
        </p>
      </header>

      <NotificationBanner />

      <div className="card mb-4">
        <ReminderForm compact defaultArea={filter === "alla" ? undefined : filter} onSubmit={addReminder} />
      </div>

      <AreaFilter value={filter} onChange={setFilter} />

      {overdue.length > 0 && (
        <section>
          <h2 className="section-title text-rose-600 dark:text-rose-400">Väntar på dig ({overdue.length})</h2>
          <ul className="flex flex-col gap-2">
            {overdue.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}

      {laterToday.length > 0 && (
        <section>
          <h2 className="section-title">Senare idag</h2>
          <ul className="flex flex-col gap-2">
            {laterToday.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}

      {lists.length > 0 && (
        <section id="listor" className="scroll-mt-4">
          <h2 className="section-title">Checklistor</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((l) => (
              <ChecklistCard
                key={l.checksKey}
                list={l}
                subtitle={
                  l.listId === "skola-pack"
                    ? `Påminner kl ${formatTime(l.triggers[0].at)} kvällen innan och ${formatTime(l.triggers[1].at)} på morgonen`
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {tomorrowList.length > 0 && (
        <section>
          <h2 className="section-title">Imorgon</h2>
          <ul className="flex flex-col gap-2">
            {tomorrowList.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}

      {doneToday.length > 0 && (
        <section>
          <h2 className="section-title">Klart idag 🎉</h2>
          <ul className="flex flex-col gap-2">
            {doneToday.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
