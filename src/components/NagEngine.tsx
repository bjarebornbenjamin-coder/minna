"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AREAS } from "@/lib/areas";
import { activeChecklists, remainingItems } from "@/lib/checklists";
import { isSameDay } from "@/lib/dates";
import { checklistMessage, reminderMessage } from "@/lib/messages";
import { isQuiet, nextNagAt } from "@/lib/nag";
import { showSystemNotification } from "@/lib/notify";
import { useStore } from "@/lib/store";
import type { AreaId } from "@/lib/types";

interface Toast {
  key: string;
  focus?: boolean;
  kind: "reminder" | "list";
  refId: string;
  title: string;
  body: string;
  area: AreaId;
}

const TICK_MS = 15000;

/**
 * Checks reminders and checklists regularly and nags when it's time.
 * Works while the app is open (or in a background tab). Real push notifications
 * when the app is fully closed need a server; that comes in a later step.
 */
export function NagEngine() {
  const store = useStore();
  const { state, ready } = store;
  const [toasts, setToasts] = useState<Toast[]>([]);
  const storeRef = useRef(store);
  storeRef.current = store;
  const tickRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!ready) return;

    const tick = () => {
      const { state, markReminderNotified, markListNotified } = storeRef.current;
      const now = new Date();
      const { settings } = state;
      const fired: Toast[] = [];

      for (const r of state.reminders) {
        if (r.done || !settings.areas.includes(r.area)) continue;
        const next = nextNagAt({
          level: r.nag,
          start: new Date(r.due),
          nagCount: r.nagCount,
          lastNotifiedAt: r.lastNotifiedAt,
          snoozedUntil: r.snoozedUntil,
        });
        if (!next || next > now || isQuiet(r.area, settings, now)) continue;
        markReminderNotified(r.id);
        fired.push({
          key: `r:${r.id}`,
          kind: "reminder",
          focus: r.nag === "mamma",
          refId: r.id,
          title: r.title,
          body: reminderMessage(r.title, settings.tone, r.nagCount, settings.name),
          area: r.area,
        });
      }

      for (const list of activeChecklists(state, now)) {
        const remaining = remainingItems(state, list);
        if (remaining.length === 0) continue;
        for (const trig of list.triggers) {
          // Tjata bara samma dag som triggern, inte i efterhand dagen efter
          if (trig.at > now || !isSameDay(trig.at, now) || isQuiet(list.area, settings, now)) continue;
          const info = state.listNags[trig.nagKey];
          const next = nextNagAt({
            level: list.nag,
            start: trig.at,
            nagCount: info?.count ?? 0,
            lastNotifiedAt: info?.last,
            snoozedUntil: info?.snoozedUntil,
          });
          if (!next || next > now) continue;
          markListNotified(trig.nagKey);
          fired.push({
            key: `l:${trig.nagKey}`,
            kind: "list",
            refId: trig.nagKey,
            title: trig.label,
            body: checklistMessage(
              list.name,
              remaining.map((i) => i.text),
              settings.tone,
              info?.count ?? 0,
            ),
            area: list.area,
          });
        }
      }

      if (fired.length) {
        setToasts((cur) => [...cur.filter((t) => !fired.some((f) => f.key === t.key)), ...fired]);
        for (const t of fired) {
          void showSystemNotification(t.title, t.body, t.key);
        }
        // Only vibrate after the user has interacted with the page (browsers block it otherwise)
        const activation = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
        if ("vibrate" in navigator && activation?.hasBeenActive) navigator.vibrate([120, 60, 120]);
      }
    };

    tickRef.current = tick;
    tick();
    const id = setInterval(tick, TICK_MS);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [ready]);

  // Check right away when reminders, lists or the schedule change (e.g. a new one that is already due)
  useEffect(() => {
    if (ready) tickRef.current();
  }, [state.reminders, state.routines, state.school, state.settings, ready]);

  // Show the number of overdue items in the tab title
  useEffect(() => {
    if (!ready) return;
    const now = new Date();
    const overdue = state.reminders.filter(
      (r) => !r.done && state.settings.areas.includes(r.area) && new Date(r.due) <= now,
    ).length;
    document.title = overdue ? `(${overdue}) Minna` : "Minna";
  }, [state, ready]);

  const dismiss = (key: string) => setToasts((cur) => cur.filter((t) => t.key !== key));

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-3 md:items-end md:p-6" aria-live="polite">
      {toasts.slice(-3).map((t) => (
        <div
          key={t.key}
          role="alert"
          className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-md border border-line bg-surface p-4 pl-5 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)] animate-[slidein_.35s_cubic-bezier(.16,1,.3,1)]`}
        >
          <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${t.focus ? "bg-vermilion" : "bg-accent"}`} />
          <p className="eyebrow mb-1">{t.focus ? "Focus Mode" : AREAS[t.area].label}</p>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{t.title}</p>
              <p className="mt-0.5 text-sm text-ink-2">{t.body}</p>
            </div>
            <button
              onClick={() => dismiss(t.key)}
              className="-mt-1 -mr-1 p-1 text-sm text-ink-2 hover:text-ink"
              aria-label="Dismiss"
            >
              Close
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            {t.kind === "reminder" ? (
              <button
                onClick={() => {
                  store.completeReminder(t.refId);
                  dismiss(t.key);
                }}
                className="btn-primary flex-1"
              >
                Done
              </button>
            ) : (
              <Link href="/app#lists" onClick={() => dismiss(t.key)} className="btn-primary flex-1 text-center">
                Open list
              </Link>
            )}
            <button
              onClick={() => {
                if (t.kind === "reminder") store.snoozeReminder(t.refId, 10);
                else store.snoozeList(t.refId, 10);
                dismiss(t.key);
              }}
              className="btn-secondary"
            >
              Snooze 10 min
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
