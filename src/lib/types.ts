export type AreaId = "privat" | "jobb" | "skola";

export type NagLevel = "av" | "mild" | "normal" | "mamma";

export type Repeat = "ingen" | "dagligen" | "vardagar" | "veckovis";

export type Tone = "varm" | "saklig" | "rolig";

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  area: AreaId;
  /** ISO date/time when the reminder is due */
  due: string;
  repeat: Repeat;
  nag: NagLevel;
  done: boolean;
  doneAt?: string;
  /** Number of times we have nagged about the current occurrence */
  nagCount: number;
  lastNotifiedAt?: string;
  snoozedUntil?: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
}

/** En rutin = en checklista som dyker upp vissa dagar vid en viss tid (t.ex. morgonkoll) */
export interface Routine {
  id: string;
  name: string;
  emoji: string;
  area: AreaId;
  /** "HH:MM" */
  time: string;
  /** 0 = Sunday ... 6 = Saturday */
  days: number[];
  items: ChecklistItem[];
  nag: NagLevel;
}

export interface Subject {
  id: string;
  name: string;
  /** Things to bring when you have the subject */
  items: string[];
}

export interface SchoolSettings {
  subjects: Subject[];
  /** veckodag (1-5) -> lista med subject-id */
  schedule: Record<number, string[]>;
  /** When the evening before to remind about packing, "HH:MM" */
  packTime: string;
  /** Morning reminder on the day itself, "HH:MM" */
  morningTime: string;
}

export interface Settings {
  name: string;
  tone: Tone;
  areas: AreaId[];
  workHours: { start: string; end: string; days: number[] };
  quietWorkOutsideHours: boolean;
  onboarded: boolean;
  /** Access code for the chat if the server requires one */
  accessCode?: string;
}

export interface AppState {
  version: 1;
  settings: Settings;
  reminders: Reminder[];
  routines: Routine[];
  school: SchoolSettings;
  /** nyckel: `${listId}:${YYYY-MM-DD}` -> avbockade item-id:n */
  checks: Record<string, string[]>;
  /** key: `${listId}:${YYYY-MM-DD}` -> nag count for checklists */
  listNags: Record<string, { count: number; last?: string; snoozedUntil?: string }>;
}
