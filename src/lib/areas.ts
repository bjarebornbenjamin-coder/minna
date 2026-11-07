import type { AreaId, NagLevel, Repeat, Tone } from "./types";

export const AREAS: Record<AreaId, { label: string; emoji: string; dot: string; chip: string; ring: string }> = {
  privat: {
    label: "Privat",
    emoji: "🏠",
    dot: "bg-emerald-500",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
    ring: "ring-emerald-500",
  },
  jobb: {
    label: "Jobb",
    emoji: "💼",
    dot: "bg-sky-500",
    chip: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
    ring: "ring-sky-500",
  },
  skola: {
    label: "Skola",
    emoji: "🎒",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
    ring: "ring-amber-500",
  },
};

export const AREA_IDS: AreaId[] = ["privat", "jobb", "skola"];

export const NAG_LEVELS: Record<NagLevel, { label: string; desc: string }> = {
  av: { label: "Av", desc: "Bara i listan, ingen notis" },
  mild: { label: "Mild", desc: "En påminnelse" },
  normal: { label: "Normal", desc: "Påminner igen efter 15 min och sedan varje timme" },
  mamma: { label: "Mamma-läge", desc: "Tjatar var 10:e minut tills det är gjort" },
};

export const REPEATS: Record<Repeat, string> = {
  ingen: "Ingen upprepning",
  dagligen: "Varje dag",
  vardagar: "Vardagar",
  veckovis: "Varje vecka",
};

export const TONES: Record<Tone, { label: string; example: string }> = {
  varm: { label: "Varm", example: "Glöm inte gympapåsen 💛" },
  saklig: { label: "Saklig", example: "Påminnelse: gympapåse." },
  rolig: { label: "Rolig", example: "Gympapåsen ringde. Den vill följa med. 🎒" },
};
