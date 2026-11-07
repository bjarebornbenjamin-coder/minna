import type { AreaId, NagLevel, Repeat, Tone } from "./types";

export const AREAS: Record<AreaId, { label: string; dot: string }> = {
  privat: { label: "Personal", dot: "#2f9e6e" },
  jobb: { label: "Work", dot: "#1f7dbf" },
  skola: { label: "School", dot: "#b07a1f" },
};

export const AREA_IDS: AreaId[] = ["privat", "jobb", "skola"];

export const NAG_LEVELS: Record<NagLevel, { label: string; desc: string }> = {
  av: { label: "Off", desc: "Shows in your list, no notification" },
  mild: { label: "Gentle", desc: "One notification" },
  normal: { label: "Normal", desc: "Reminds again after 15 min, then every hour" },
  mamma: { label: "Mom Mode", desc: "Reminds you every 10 minutes until it's done" },
};

export const REPEATS: Record<Repeat, string> = {
  ingen: "Doesn't repeat",
  dagligen: "Every day",
  vardagar: "Weekdays",
  veckovis: "Every week",
};

export const TONES: Record<Tone, { label: string; example: string }> = {
  varm: { label: "Warm", example: "Don't forget your gym bag. You've got this." },
  saklig: { label: "Direct", example: "Reminder: gym bag." },
  rolig: { label: "Playful", example: "Your gym bag called. It wants to come along." },
};
