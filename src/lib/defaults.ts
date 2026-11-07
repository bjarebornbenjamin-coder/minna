import type { AppState, AreaId, Routine, Subject } from "./types";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "matte", name: "Matte", items: ["Mattebok", "Miniräknare"] },
  { id: "svenska", name: "Svenska", items: ["Svenskabok"] },
  { id: "engelska", name: "Engelska", items: ["Engelskabok"] },
  { id: "idrott", name: "Idrott", items: ["Gympakläder", "Handduk", "Vattenflaska"] },
  { id: "no", name: "NO", items: ["NO-bok"] },
  { id: "so", name: "SO", items: ["SO-bok"] },
];

export function defaultRoutines(areas: AreaId[]): Routine[] {
  const r: Routine[] = [
    {
      id: uid(),
      name: "Innan du går hemifrån",
      emoji: "🚪",
      area: "privat",
      time: "07:15",
      days: [1, 2, 3, 4, 5],
      nag: "normal",
      items: ["Nycklar", "Mobil", "Plånbok / busskort", "Laddare"].map((text) => ({ id: uid(), text })),
    },
  ];
  if (areas.includes("jobb")) {
    r.push({
      id: uid(),
      name: "Planera arbetsdagen",
      emoji: "🗂️",
      area: "jobb",
      time: "08:30",
      days: [1, 2, 3, 4, 5],
      nag: "mild",
      items: ["Gå igenom dagens möten", "Välj dagens 3 viktigaste uppgifter", "Kolla inkorgen efter deadlines"].map(
        (text) => ({ id: uid(), text }),
      ),
    });
    r.push({
      id: uid(),
      name: "Avsluta arbetsveckan",
      emoji: "✅",
      area: "jobb",
      time: "15:30",
      days: [5],
      nag: "mild",
      items: ["Följ upp obesvarade mejl", "Uppdatera status på projekt", "Planera måndagen"].map((text) => ({
        id: uid(),
        text,
      })),
    });
  }
  if (areas.includes("privat")) {
    r.push({
      id: uid(),
      name: "Kvällsavslut",
      emoji: "🌙",
      area: "privat",
      time: "21:30",
      days: [0, 1, 2, 3, 4, 5, 6],
      nag: "mild",
      items: ["Mobilen på laddning", "Kolla morgondagen i appen", "Kläder till imorgon"].map((text) => ({
        id: uid(),
        text,
      })),
    });
  }
  return r;
}

export function initialState(): AppState {
  return {
    version: 1,
    settings: {
      name: "",
      tone: "varm",
      areas: ["privat", "jobb", "skola"],
      workHours: { start: "08:00", end: "17:00", days: [1, 2, 3, 4, 5] },
      quietWorkOutsideHours: true,
      onboarded: false,
    },
    reminders: [],
    routines: [],
    school: {
      subjects: DEFAULT_SUBJECTS,
      schedule: {
        1: ["matte", "svenska", "so"],
        2: ["engelska", "idrott", "no"],
        3: ["matte", "svenska", "engelska"],
        4: ["no", "idrott", "so"],
        5: ["matte", "engelska", "svenska"],
      },
      packTime: "20:00",
      morningTime: "07:00",
    },
    checks: {},
    listNags: {},
  };
}
