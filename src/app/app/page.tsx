"use client";

import Link from "next/link";
import { useState } from "react";
import { AreaFilter, type AreaFilterValue } from "@/components/AreaFilter";
import { ChecklistCard } from "@/components/ChecklistCard";
import { Core } from "@/components/Core";
import { NotificationBanner } from "@/components/NotificationBanner";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderRow } from "@/components/ReminderRow";
import { remainingItems, routinesFor, schoolPackFor } from "@/lib/checklists";
import { addDays, formatTime, isSameDay, LOCALE } from "@/lib/dates";
import { greeting } from "@/lib/messages";
import { useNow, useStore } from "@/lib/store";

function Section({ title, count, children, id }: { title: string; count?: number; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="section-title flex justify-between">
        <span>{title}</span>
        {count !== undefined && <span className="tabular-nums">{count}</span>}
      </h2>
      {children}
    </section>
  );
}

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
  const doneToday = state.reminders.filter((r) => r.done && r.doneAt && isSameDay(new Date(r.doneAt), now) && inFilter(r.area));

  // School packing list: today's in the morning, tomorrow's from noon
  const pack = now.getHours() < 12 ? schoolPackFor(state, now) : schoolPackFor(state, tomorrow);
  const lists = [...routinesFor(state, now), ...(pack ? [pack] : [])].filter((l) => inFilter(l.area));

  const openLists = lists.filter((l) => remainingItems(state, l).length > 0).length;
  const todo = overdue.length + laterToday.length + openLists;
  const momActive = overdue.some((r) => r.nag === "mamma");

  return (
    <div>
      <header className="relative mb-10 flex items-end justify-between gap-4">
        <div className="animate-rise min-w-0">
          <p className="eyebrow">{now.toLocaleDateString(LOCALE, { weekday: "long", month: "long", day: "numeric" })}</p>
          <h1 className="display mt-3 text-[clamp(3.5rem,11vw,7.5rem)]">{greeting(now, settings.name)}.</h1>
          <p className="mt-4 text-ink-2">
            {todo === 0 ? "Nothing waiting right now." : `${todo} ${todo === 1 ? "thing" : "things"} to keep track of today.`}{" "}
            {momActive && <span className="font-medium text-[#9a6a12]">Mom Mode is on for something you missed.</span>}
          </p>
        </div>
        <Link href="/app/chat" aria-label="Ask Minna" className="hidden sm:block">
          <Core size={150} state={momActive ? "mom" : "idle"} />
        </Link>
      </header>

      <NotificationBanner />

      <div className="card mb-2">
        <ReminderForm compact defaultArea={filter === "alla" ? undefined : filter} onSubmit={addReminder} />
      </div>
      <p className="mb-8 text-sm text-ink-2">
        Or just{" "}
        <Link href="/app/chat" className="link text-ink">
          tell Minna
        </Link>{" "}
        what&apos;s coming up, in your own words.
      </p>

      <AreaFilter value={filter} onChange={setFilter} />

      {todo === 0 && tomorrowList.length === 0 && doneToday.length === 0 && (
        <p className="py-16 text-center text-ink-2">A clear day. Add something above, or enjoy it.</p>
      )}

      {overdue.length > 0 && (
        <Section title="Waiting on you" count={overdue.length}>
          <ul>
            {overdue.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </Section>
      )}

      {laterToday.length > 0 && (
        <Section title="Later today" count={laterToday.length}>
          <ul>
            {laterToday.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </Section>
      )}

      {lists.length > 0 && (
        <Section title="Checklists" id="lists">
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
        </Section>
      )}

      {tomorrowList.length > 0 && (
        <Section title="Tomorrow" count={tomorrowList.length}>
          <ul>
            {tomorrowList.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </Section>
      )}

      {doneToday.length > 0 && (
        <Section title="Done today" count={doneToday.length}>
          <ul>
            {doneToday.map((r) => (
              <ReminderRow key={r.id} r={r} now={now} />
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
