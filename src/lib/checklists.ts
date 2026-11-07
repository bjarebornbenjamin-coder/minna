import { addDays, atTime, dayKey, WEEKDAYS } from "./dates";
import type { AppState, AreaId, ChecklistItem, NagLevel } from "./types";

export interface ChecklistInstance {
  /** Key for check-offs: `${listId}:${YYYY-MM-DD}` */
  checksKey: string;
  listId: string;
  name: string;
  emoji: string;
  area: AreaId;
  items: ChecklistItem[];
  /** Times when the list should remind */
  triggers: { nagKey: string; at: Date; label: string }[];
  nag: NagLevel;
  /** Which day the list is for */
  date: Date;
  editHref: string;
}

export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-");
}

/** School packing list for a given day, or null if there are no classes */
export function schoolPackFor(state: AppState, date: Date): ChecklistInstance | null {
  if (!state.settings.areas.includes("skola")) return null;
  const ids = state.school.schedule[date.getDay()] ?? [];
  const seen = new Set<string>();
  const items: ChecklistItem[] = [];
  for (const id of ids) {
    const subject = state.school.subjects.find((s) => s.id === id);
    for (const text of subject?.items ?? []) {
      const key = slug(text);
      if (!seen.has(key)) {
        seen.add(key);
        items.push({ id: key, text });
      }
    }
  }
  if (items.length === 0) return null;
  const dk = dayKey(date);
  return {
    checksKey: `skola-pack:${dk}`,
    listId: "skola-pack",
    name: `Pack for ${WEEKDAYS[date.getDay()]}`,
    emoji: "🎒",
    area: "skola",
    items,
    nag: "normal",
    date,
    editHref: "/school",
    triggers: [
      { nagKey: `skola-pack-kvall:${dk}`, at: atTime(addDays(date, -1), state.school.packTime), label: "Pack your bag" },
      { nagKey: `skola-pack-morgon:${dk}`, at: atTime(date, state.school.morningTime), label: "Got everything with you?" },
    ],
  };
}

export function routinesFor(state: AppState, date: Date): ChecklistInstance[] {
  const dk = dayKey(date);
  return state.routines
    .filter((r) => r.days.includes(date.getDay()) && state.settings.areas.includes(r.area) && r.items.length > 0)
    .map((r) => ({
      checksKey: `${r.id}:${dk}`,
      listId: r.id,
      name: r.name,
      emoji: r.emoji,
      area: r.area,
      items: r.items,
      nag: r.nag,
      date,
      editHref: "/routines",
      triggers: [{ nagKey: `${r.id}:${dk}`, at: atTime(date, r.time), label: r.name }],
    }))
    .sort((a, b) => a.triggers[0].at.getTime() - b.triggers[0].at.getTime());
}

/** All checklists that may have notifications due today */
export function activeChecklists(state: AppState, now: Date): ChecklistInstance[] {
  const lists: ChecklistInstance[] = [...routinesFor(state, now)];
  const today = schoolPackFor(state, now);
  const tomorrow = schoolPackFor(state, addDays(now, 1));
  if (today) lists.push(today);
  if (tomorrow) lists.push(tomorrow);
  return lists;
}

export function remainingItems(state: AppState, list: ChecklistInstance): ChecklistItem[] {
  const checked = new Set(state.checks[list.checksKey] ?? []);
  return list.items.filter((i) => !checked.has(i.id));
}
