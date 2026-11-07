import type { AreaId, NagLevel, Repeat, Tone } from "./types";

export const AREAS: Record<AreaId, { label: string; emoji: string; dot: string; chip: string; ring: string; glow: string }> = {
  privat: {
    label: "Personal",
    emoji: "🏠",
    dot: "bg-emerald-400",
    chip: "bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20",
    ring: "ring-emerald-400/60",
    glow: "shadow-[0_0_24px_-6px_rgba(52,211,153,0.6)]",
  },
  jobb: {
    label: "Work",
    emoji: "💼",
    dot: "bg-sky-400",
    chip: "bg-sky-400/10 text-sky-300 ring-1 ring-sky-400/20",
    ring: "ring-sky-400/60",
    glow: "shadow-[0_0_24px_-6px_rgba(56,189,248,0.6)]",
  },
  skola: {
    label: "School",
    emoji: "🎒",
    dot: "bg-amber-400",
    chip: "bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20",
    ring: "ring-amber-400/60",
    glow: "shadow-[0_0_24px_-6px_rgba(251,191,36,0.6)]",
  },
};

export const AREA_IDS: AreaId[] = ["privat", "jobb", "skola"];

export const NAG_LEVELS: Record<NagLevel, { label: string; desc: string }> = {
  av: { label: "Off", desc: "Shows in your list, no notification" },
  mild: { label: "Gentle", desc: "One notification" },
  normal: { label: "Normal", desc: "Reminds again after 15 min, then every hour" },
  mamma: { label: "Mom mode", desc: "Nags every 10 minutes until it's done" },
};

export const REPEATS: Record<Repeat, string> = {
  ingen: "Doesn't repeat",
  dagligen: "Every day",
  vardagar: "Weekdays",
  veckovis: "Every week",
};

export const TONES: Record<Tone, { label: string; example: string }> = {
  varm: { label: "Warm", example: "Don't forget your gym bag 💜" },
  saklig: { label: "Direct", example: "Reminder: gym bag." },
  rolig: { label: "Playful", example: "Your gym bag called. It wants to come along. 🎒" },
};
