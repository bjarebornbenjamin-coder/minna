import type { AppState, AreaId, Routine, Subject } from "./types";

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "math", name: "Math", items: ["Math book", "Calculator"] },
  { id: "english", name: "English", items: ["English book"] },
  { id: "science", name: "Science", items: ["Science notebook"] },
  { id: "history", name: "History", items: ["History book"] },
  { id: "pe", name: "PE", items: ["Gym clothes", "Towel", "Water bottle"] },
  { id: "art", name: "Art", items: ["Sketchbook", "Pencils"] },
];

export function defaultRoutines(areas: AreaId[]): Routine[] {
  const r: Routine[] = [
    {
      id: uid(),
      name: "Before you leave home",
      emoji: "🚪",
      area: "privat",
      time: "07:15",
      days: [1, 2, 3, 4, 5],
      nag: "normal",
      items: ["Keys", "Phone", "Wallet / bus pass", "Charger"].map((text) => ({ id: uid(), text })),
    },
  ];
  if (areas.includes("jobb")) {
    r.push({
      id: uid(),
      name: "Plan your workday",
      emoji: "🗂️",
      area: "jobb",
      time: "08:30",
      days: [1, 2, 3, 4, 5],
      nag: "mild",
      items: ["Review today's meetings", "Pick your top 3 tasks", "Check inbox for deadlines"].map(
        (text) => ({ id: uid(), text }),
      ),
    });
    r.push({
      id: uid(),
      name: "Wrap up the work week",
      emoji: "✅",
      area: "jobb",
      time: "15:30",
      days: [5],
      nag: "mild",
      items: ["Follow up on unanswered emails", "Update project status", "Plan Monday"].map((text) => ({
        id: uid(),
        text,
      })),
    });
  }
  if (areas.includes("privat")) {
    r.push({
      id: uid(),
      name: "Evening wind-down",
      emoji: "🌙",
      area: "privat",
      time: "21:30",
      days: [0, 1, 2, 3, 4, 5, 6],
      nag: "mild",
      items: ["Phone on the charger", "Check tomorrow in Minna", "Lay out clothes for tomorrow"].map((text) => ({
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
        1: ["math", "english", "history"],
        2: ["science", "pe", "art"],
        3: ["math", "english", "science"],
        4: ["history", "pe", "art"],
        5: ["math", "science", "english"],
      },
      packTime: "20:00",
      morningTime: "07:00",
    },
    checks: {},
    listNags: {},
  };
}
