"use client";

import Image from "next/image";
import Link from "next/link";
import { ReminderRow } from "@/components/ReminderRow";
import { TONES } from "@/lib/areas";
import { formatDue } from "@/lib/dates";
import { useNow, useStore } from "@/lib/store";

export default function MomModePage() {
  const { state, updateReminder } = useStore();
  const now = useNow();
  const active = state.reminders
    .filter((r) => !r.done && state.settings.areas.includes(r.area))
    .sort((a, b) => a.due.localeCompare(b.due));
  const mom = active.filter((r) => r.nag === "mamma");
  const others = active.filter((r) => r.nag !== "mamma").slice(0, 12);

  return (
    <div>
      <p className="eyebrow text-[#9a6a12]">Mom Mode</p>
      <h1 className="display mt-3 text-[clamp(3.5rem,10vw,6.5rem)]">She remembers.</h1>
      <p className="mt-4 max-w-lg text-ink-2">
        For the things that can&apos;t slip. Minna reminds you, then reminds you again every ten minutes until you mark it done.
        Snooze when you need a moment.
      </p>

      <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-md bg-bg-2">
        <Image
          src="/assets/minna-editorial/minna-mom-mode.png"
          alt="The Minna Core beside a checklist, its band glowing amber"
          fill
          sizes="(min-width: 768px) 720px, 100vw"
          className="object-cover object-[60%_50%]"
          priority
        />
      </div>

      <dl className="mt-8 grid gap-6 border-t border-line pt-6 sm:grid-cols-3">
        <div>
          <dt className="eyebrow">First</dt>
          <dd className="mt-2 text-sm">A notification at the time you set.</dd>
        </div>
        <div>
          <dt className="eyebrow">Then</dt>
          <dd className="mt-2 text-sm">Another every 10 minutes, a little more direct each time.</dd>
        </div>
        <div>
          <dt className="eyebrow">Tone</dt>
          <dd className="mt-2 text-sm">
            {TONES[state.settings.tone].label}.{" "}
            <Link href="/app/settings" className="link text-ink-2">
              Change
            </Link>
          </dd>
        </div>
      </dl>

      <h2 className="section-title flex justify-between">
        <span>On Mom Mode</span>
        <span className="tabular-nums">{mom.length}</span>
      </h2>
      {mom.length === 0 ? (
        <p className="py-6 text-ink-2">Nothing on Mom Mode right now. Turn it on for anything below, or tell Minna “don&apos;t let me forget…”.</p>
      ) : (
        <ul>
          {mom.map((r) => (
            <ReminderRow key={r.id} r={r} now={now} />
          ))}
        </ul>
      )}

      {others.length > 0 && (
        <>
          <h2 className="section-title">Upcoming, without Mom Mode</h2>
          <ul>
            {others.map((r) => (
              <li key={r.id} className="flex items-baseline gap-4 border-b border-line py-3">
                <span className="min-w-0 flex-1">
                  <span className="block">{r.title}</span>
                  <span className="text-xs text-ink-2">{formatDue(r.due, now)}</span>
                </span>
                <button className="btn-secondary !py-1.5 text-xs" onClick={() => updateReminder(r.id, { nag: "mamma" })}>
                  Turn on
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
