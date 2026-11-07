"use client";

import Link from "next/link";
import { Mark } from "@/components/Mark";
import { ReminderRow } from "@/components/ReminderRow";
import { TONES } from "@/lib/areas";
import { formatDue } from "@/lib/dates";
import { useNow, useStore } from "@/lib/store";

export default function FocusModePage() {
  const { state, updateReminder } = useStore();
  const now = useNow();
  const active = state.reminders
    .filter((r) => !r.done && state.settings.areas.includes(r.area))
    .sort((a, b) => a.due.localeCompare(b.due));
  const focused = active.filter((r) => r.nag === "mamma");
  const others = active.filter((r) => r.nag !== "mamma").slice(0, 12);

  return (
    <div>
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow !text-vermilion">Focus Mode</p>
          <h1 className="display mt-3 text-[clamp(3.5rem,10vw,6.5rem)]">Stay on it.</h1>
        </div>
        <Mark size={110} state="focus" className="hidden sm:block" />
      </div>
      <p className="mt-4 max-w-lg text-ink-2">
        For the few things that can&apos;t slip. Minna reminds you at the time you set, then every ten minutes until you mark it
        done. Snooze whenever you need a moment.
      </p>

      <dl className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">At the time</dt>
          <dd className="mt-2 text-sm">One notification, like any reminder.</dd>
        </div>
        <div>
          <dt className="eyebrow">If it&apos;s still open</dt>
          <dd className="mt-2 text-sm">Another every 10 minutes until you check it off.</dd>
        </div>
        <div>
          <dt className="eyebrow">Wording</dt>
          <dd className="mt-2 text-sm">
            {TONES[state.settings.tone].label}.{" "}
            <Link href="/app/settings" className="link text-ink-2">
              Change
            </Link>
          </dd>
        </div>
      </dl>

      <h2 className="section-title flex justify-between">
        <span>On Focus Mode</span>
        <span className="tabular-nums">{focused.length}</span>
      </h2>
      {focused.length === 0 ? (
        <p className="py-6 text-ink-2">
          Nothing on Focus Mode yet. Turn it on for something below, or tell Minna “make sure I don&apos;t forget…”.
        </p>
      ) : (
        <ul>
          {focused.map((r) => (
            <ReminderRow key={r.id} r={r} now={now} />
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <>
          <h2 className="section-title">Other upcoming reminders</h2>
          <ul>
            {others.map((r) => (
              <li key={r.id} className="flex items-baseline gap-4 border-b border-line py-3">
                <span className="min-w-0 flex-1">
                  <span className="block">{r.title}</span>
                  <span className="text-xs text-ink-2">{formatDue(r.due, now)}</span>
                </span>
                <button className="btn-secondary !py-1.5 text-xs" onClick={() => updateReminder(r.id, { nag: "mamma" })}>
                  Add to Focus Mode
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
