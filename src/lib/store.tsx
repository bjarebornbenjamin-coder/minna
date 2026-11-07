"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { addDays } from "./dates";
import { initialState, uid } from "./defaults";
import type { AppState, Reminder, Routine, SchoolSettings, Settings } from "./types";

const STORAGE_KEY = "minna:v1";

function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      const base = initialState();
      return { ...base, ...parsed, settings: { ...base.settings, ...parsed.settings } };
    }
  } catch {
    // trasig eller blockerad lagring, börja om
  }
  return initialState();
}

/** Nästa förekomst för en upprepad påminnelse */
function nextOccurrence(r: Reminder): string | null {
  const due = new Date(r.due);
  const now = new Date();
  const step = (d: Date): Date => {
    switch (r.repeat) {
      case "dagligen":
        return addDays(d, 1);
      case "veckovis":
        return addDays(d, 7);
      case "vardagar": {
        let x = addDays(d, 1);
        while (x.getDay() === 0 || x.getDay() === 6) x = addDays(x, 1);
        return x;
      }
      default:
        return d;
    }
  };
  if (r.repeat === "ingen") return null;
  let next = step(due);
  while (next <= now) next = step(next);
  return next.toISOString();
}

export type NewReminder = Pick<Reminder, "title" | "area" | "due" | "repeat" | "nag"> & { notes?: string };

interface Store {
  state: AppState;
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => void;
  addReminder: (r: NewReminder) => void;
  updateReminder: (id: string, patch: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  completeReminder: (id: string) => void;
  snoozeReminder: (id: string, minutes: number) => void;
  markReminderNotified: (id: string) => void;
  saveRoutine: (r: Routine) => void;
  deleteRoutine: (id: string) => void;
  updateSchool: (patch: Partial<SchoolSettings>) => void;
  toggleCheck: (checksKey: string, itemId: string) => void;
  markListNotified: (nagKey: string) => void;
  snoozeList: (nagKey: string, minutes: number) => void;
  replaceState: (s: AppState) => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    setState(load());
    setReady(true);
    loaded.current = true;
    // Synka mellan flikar
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setState(load());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // full eller blockerad lagring
    }
  }, [state]);

  const mapReminder = useCallback((id: string, fn: (r: Reminder) => Reminder) => {
    setState((s) => ({ ...s, reminders: s.reminders.map((r) => (r.id === id ? fn(r) : r)) }));
  }, []);

  const store = useMemo<Store>(
    () => ({
      state,
      ready,
      updateSettings: (patch) => setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      addReminder: (r) =>
        setState((s) => ({
          ...s,
          reminders: [
            ...s.reminders,
            { ...r, id: uid(), done: false, nagCount: 0, createdAt: new Date().toISOString() },
          ],
        })),
      updateReminder: (id, patch) =>
        mapReminder(id, (r) => {
          const next = { ...r, ...patch };
          // Ny tid = börja om tjatet
          if (patch.due && patch.due !== r.due) {
            next.nagCount = 0;
            next.lastNotifiedAt = undefined;
            next.snoozedUntil = undefined;
          }
          return next;
        }),
      deleteReminder: (id) => setState((s) => ({ ...s, reminders: s.reminders.filter((r) => r.id !== id) })),
      completeReminder: (id) =>
        mapReminder(id, (r) => {
          if (r.done) {
            return { ...r, done: false, doneAt: undefined };
          }
          const next = nextOccurrence(r);
          if (next) {
            // Upprepad: flytta fram till nästa gång
            return { ...r, due: next, nagCount: 0, lastNotifiedAt: undefined, snoozedUntil: undefined };
          }
          return { ...r, done: true, doneAt: new Date().toISOString(), snoozedUntil: undefined };
        }),
      snoozeReminder: (id, minutes) =>
        mapReminder(id, (r) => ({ ...r, snoozedUntil: new Date(Date.now() + minutes * 60000).toISOString() })),
      markReminderNotified: (id) =>
        mapReminder(id, (r) => ({
          ...r,
          nagCount: r.nagCount + 1,
          lastNotifiedAt: new Date().toISOString(),
          snoozedUntil: undefined,
        })),
      saveRoutine: (routine) =>
        setState((s) => {
          const exists = s.routines.some((r) => r.id === routine.id);
          return {
            ...s,
            routines: exists ? s.routines.map((r) => (r.id === routine.id ? routine : r)) : [...s.routines, routine],
          };
        }),
      deleteRoutine: (id) => setState((s) => ({ ...s, routines: s.routines.filter((r) => r.id !== id) })),
      updateSchool: (patch) => setState((s) => ({ ...s, school: { ...s.school, ...patch } })),
      toggleCheck: (key, itemId) =>
        setState((s) => {
          const cur = new Set(s.checks[key] ?? []);
          if (cur.has(itemId)) cur.delete(itemId);
          else cur.add(itemId);
          return { ...s, checks: { ...s.checks, [key]: [...cur] } };
        }),
      markListNotified: (nagKey) =>
        setState((s) => ({
          ...s,
          listNags: {
            ...s.listNags,
            [nagKey]: { count: (s.listNags[nagKey]?.count ?? 0) + 1, last: new Date().toISOString() },
          },
        })),
      snoozeList: (nagKey, minutes) =>
        setState((s) => ({
          ...s,
          listNags: {
            ...s.listNags,
            [nagKey]: {
              count: s.listNags[nagKey]?.count ?? 0,
              last: s.listNags[nagKey]?.last,
              snoozedUntil: new Date(Date.now() + minutes * 60000).toISOString(),
            },
          },
        })),
      replaceState: (s) => setState(s),
    }),
    [state, ready, mapReminder],
  );

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore måste användas inom StoreProvider");
  return s;
}

/** Klocka som tickar så att vyer uppdateras */
export function useNow(intervalMs = 30000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
