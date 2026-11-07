"use client";

import Link from "next/link";
import { useState } from "react";
import { AreaFilter, type AreaFilterValue } from "@/components/AreaFilter";
import { ChecklistCard } from "@/components/ChecklistCard";
import { CoreView } from "@/components/core/CoreView";
import { NotificationBanner } from "@/components/NotificationBanner";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderRow } from "@/components/ReminderRow";
import { remainingItems, routinesFor, schoolPackFor } from "@/lib/checklists";
import { addDays, formatTime, isSameDay, LOCALE } from "@/lib/dates";
import { greeting } from "@/lib/messages";
import { useNow, useStore } from "@/lib/store";

export default function TodayPage() {
  const { state, addReminder } = useStore();
  const now = useNow();
  const [filter, setFilter] = useState<AreaFilterValue>("alla");
  const { settings } = state;

  const inFilter = (area: string) => settings.areas.includes(area as never) && (filter === "alla" || filter === area);
  const tomorrow = addDays(now, 1);

  const active = state.reminders.filter((r) => !r.done && inFilter(r.area)).sort((a, b) => a.due.localeCompare(b.due));
  const overdue = active.filter((r) => new Date(r.due) <= now);
  const laterToday = active.filter((r) => new Date(r.due) > now && isSameDay(new Date(r.due), now));
  const tomorrowList = active.filter((r) => isSameDay(new Date(r.due), tomorrow));
  const doneToday = state.reminders.filter(
    (r) => r.done && r.doneAt && isSameDay(new Date(r.doneAt), now) && inFilter(r.area),
  );

  // School packing list: today's in the morning, tomorrow's from noon
  const pack = now.getHours() < 12 ? schoolPackFor(state, now) : schoolPackFor(state, tomorrow);
  const lists = [...routinesFor(state, now), ...(pack ? [pack] : [])].filter((l) => inFilter(l.area));

  const openLists = lists.filter((l) => remainingItems(state, l).length > 0).length;
  const todo = overdue.length + laterToday.length + openLists;
  const momActive = overdue.some((r) => r.nag === "mamma");

  return (
    <div>
      <header className="relative mb-6 flex flex-col-reverse items-center gap-2 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <div className="flex-1 animate-fadeup">
          <p className="text-sm text-zinc-500">
            {now.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <h1 className="font-display text-4xl font-semibold tracking-tight gradient-text sm:text-5xl">
            {greeting(now, settings.name)}
          </h1>
          <p className="text-zinc-400 mt-2">
            {todo === 0
              ? "Nothing waiting right now. Nice work ✨"
              : `You have ${todo} ${todo === 1 ? "thing" : "things"} to keep track of today.`}
          </p>
        </div>
        <Link href="/chat" aria-label="Talk to Minna" className="-my-4 sm:-my-8">
          <CoreView size={210} state={momActive ? "mom" : "idle"} />
        </Link>
      </header>

      <NotificationBanner />

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] mb-3">
        <Link href="/chat" className="card flex items-center gap-3 transition hover:!border-violet-400/30">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500/30 to-cyan-400/20 text-cyan-200 ring-1 ring-white/10">
            ✦
          </span>
          <span className="flex-1">
            <span className="block font-medium">Tell Minna</span>
            <span className="block text-sm text-zinc-400">“I have a chemistry exam on Thursday…” and I&apos;ll handle the rest.</span>
          </span>
          <span className="text-zinc-500">›</span>
        </Link>
      </div>

      <div className="card mb-4">
        <ReminderForm compact defaultArea={filter === "alla" ? undefined : filter} onSubmit={addReminder} />
      </div>

      <AreaFilter value={filter} onChange={setFilter} />

      {overdue.length > 0 && (
        <section>
          <h2 className="section-title !text-rose-300">Waiting on you ({overdue.length})</h2>
          <ul className="flex flex-col gap-2">
            {overdue.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}

      {laterToday.length > 0 && (
        <section>
          <h2 className="section-title">Later today</h2>
          <ul className="flex flex-col gap-2">
            {laterToday.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}

      {lists.length > 0 && (
        <section id="lists" className="scroll-mt-4">
          <h2 className="section-title">Checklists</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {lists.map((l) => (
              <ChecklistCard
                key={l.checksKey}
                list={l}
                subtitle={
                  l.listId === "skola-pack"
                    ? `Reminds at ${formatTime(l.triggers[0].at)} the night before and ${formatTime(l.triggers[1].at)} in the morning`
                    : undefined
                }
              />
            ))}
          </div>
        </section>
      )}

      {tomorrowList.length > 0 && (
        <section>
          <h2 className="section-title">Tomorrow</h2>
          <ul className="flex flex-col gap-2">
            {tomorrowList.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </section>
      )}

      {doneToday.length > 0 && (
        <section>
          <h2 className="section-title">Done today 🎉</h2>
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
