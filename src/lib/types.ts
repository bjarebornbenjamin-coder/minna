export type AreaId = "privat" | "jobb" | "skola";

export type NagLevel = "av" | "mild" | "normal" | "mamma";

export type Repeat = "ingen" | "dagligen" | "vardagar" | "veckovis";

export type Tone = "varm" | "saklig" | "rolig";

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  area: AreaId;
  /** ISO-datum/tid när påminnelsen ska gå */
  due: string;
  repeat: Repeat;
  nag: NagLevel;
  done: boolean;
  doneAt?: string;
  /** Antal gånger vi har påmint om nuvarande förekomst */
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
  /** 0 = söndag ... 6 = lördag */
  days: number[];
  items: ChecklistItem[];
  nag: NagLevel;
}

export interface Subject {
  id: string;
  name: string;
  /** Saker som ska med när man har ämnet */
  items: string[];
}

export interface SchoolSettings {
  subjects: Subject[];
  /** veckodag (1-5) -> lista med subject-id */
  schedule: Record<number, string[]>;
  /** När kvällen innan vi ska påminna om att packa väskan, "HH:MM" */
  packTime: string;
  /** Morgonpåminnelse dagen samma dag, "HH:MM" */
  morningTime: string;
}

export interface Settings {
  name: string;
  tone: Tone;
  areas: AreaId[];
  workHours: { start: string; end: string; days: number[] };
  quietWorkOutsideHours: boolean;
  onboarded: boolean;
}

export interface AppState {
  version: 1;
  settings: Settings;
  reminders: Reminder[];
  routines: Routine[];
  school: SchoolSettings;
  /** nyckel: `${listId}:${YYYY-MM-DD}` -> avbockade item-id:n */
  checks: Record<string, string[]>;
  /** nyckel: `${listId}:${YYYY-MM-DD}` -> antal tjat för checklistor */
  listNags: Record<string, { count: number; last?: string; snoozedUntil?: string }>;
}
