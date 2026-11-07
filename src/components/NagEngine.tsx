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
  kind: "reminder" | "list";
  refId: string;
  title: string;
  body: string;
  area: AreaId;
}

const TICK_MS = 15000;

/**
 * Går igenom påminnelser och checklistor regelbundet och tjatar när det är dags.
 * Fungerar medan appen är öppen (eller ligger i en bakgrundsflik). Riktiga push-notiser
 * när appen är helt stängd kräver en server, det kommer i ett senare steg.
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
          refId: r.id,
          title: `${AREAS[r.area].emoji} ${r.title}`,
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
            title: `${list.emoji} ${trig.label}`,
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
        if ("vibrate" in navigator) navigator.vibrate?.([120, 60, 120]);
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

  // Kolla direkt när påminnelser, listor eller schema ändras (t.ex. en ny som redan har passerat)
  useEffect(() => {
    if (ready) tickRef.current();
  }, [state.reminders, state.routines, state.school, state.settings, ready]);

  // Visa antal förfallna i fliktiteln
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
    <div className="fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 p-3 pointer-events-none" aria-live="polite">
      {toasts.slice(-3).map((t) => (
        <div
          key={t.key}
          role="alert"
          className={`pointer-events-auto w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl ring-2 ${AREAS[t.area].ring} p-4 animate-[slidein_.25s_ease-out]`}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{t.title}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mt-0.5">{t.body}</p>
            </div>
            <button
              onClick={() => dismiss(t.key)}
              className="text-zinc-400 hover:text-zinc-600 -mt-1 -mr-1 p-1"
              aria-label="Stäng"
            >
              ✕
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
                ✓ Klar
              </button>
            ) : (
              <Link href="/#listor" onClick={() => dismiss(t.key)} className="btn-primary flex-1 text-center">
                Öppna listan
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
              ⏰ 10 min
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
