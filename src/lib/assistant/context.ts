import { NAG_LEVELS, REPEATS } from "../areas";
import { dayKey, hhmm, WEEKDAYS } from "../dates";
import type { AppState, AreaId } from "../types";

const AREA_NAME: Record<AreaId, string> = { privat: "personal", jobb: "work", skola: "school" };

function localStamp(d: Date): string {
  return `${dayKey(d)}T${hhmm(d)}`;
}

/** Text about the user's situation, sent with every message */
export function buildContext(state: AppState, now: Date = new Date()): string {
  const { settings } = state;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lines: string[] = [];

  lines.push("# Current situation");
  lines.push(`Now: ${WEEKDAYS[now.getDay()]} ${localStamp(now)} (time zone ${tz})`);
  lines.push("Next 7 days:");
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    lines.push(`- ${WEEKDAYS[d.getDay()]} ${dayKey(d)}${i === 0 ? " (today)" : i === 1 ? " (tomorrow)" : ""}`);
  }
  lines.push("");
  lines.push("# The user");
  lines.push(`Name: ${settings.name || "(unknown)"}`);
  lines.push(`Preferred tone: ${{ varm: "warm", saklig: "direct", rolig: "playful" }[settings.tone]}`);
  lines.push(`Active areas: ${settings.areas.map((a) => AREA_NAME[a]).join(", ")}`);
  if (settings.areas.includes("jobb")) {
    const days = settings.workHours.days.map((d) => WEEKDAYS[d].slice(0, 3)).join(", ");
    lines.push(`Work hours: ${settings.workHours.start}–${settings.workHours.end} (${days})`);
  }

  const active = state.reminders
    .filter((r) => !r.done && settings.areas.includes(r.area))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 80);
  lines.push("");
  lines.push(`# Active reminders (${active.length})`);
  if (active.length === 0) lines.push("(none)");
  for (const r of active) {
    const extra = [
      r.repeat !== "ingen" ? REPEATS[r.repeat].toLowerCase() : null,
      `nag: ${NAG_LEVELS[r.nag].label.toLowerCase()}`,
      new Date(r.due) <= now ? "OVERDUE" : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(
      `- [${r.id}] ${r.title} | ${localStamp(new Date(r.due))} | ${AREA_NAME[r.area]} | ${extra}${r.notes ? ` | ${r.notes}` : ""}`,
    );
  }

  const doneRecent = state.reminders
    .filter((r) => r.done && r.doneAt && now.getTime() - new Date(r.doneAt).getTime() < 3 * 86400000)
    .slice(-15);
  if (doneRecent.length) {
    lines.push("");
    lines.push("# Completed in the last few days");
    for (const r of doneRecent) lines.push(`- [${r.id}] ${r.title}`);
  }

  const routines = state.routines.filter((r) => settings.areas.includes(r.area));
  lines.push("");
  lines.push("# Routines/checklists");
  if (routines.length === 0) lines.push("(none)");
  for (const r of routines) {
    const days = r.days
      .slice()
      .sort()
      .map((d) => WEEKDAYS[d].slice(0, 3))
      .join(", ");
    lines.push(
      `- [${r.id}] ${r.emoji} ${r.name} | ${days} at ${r.time} | ${AREA_NAME[r.area]} | ${r.items.map((i) => i.text).join(", ")}`,
    );
  }

  lines.push("");
  if (settings.memoryEnabled) {
    lines.push(`# Memory (on, ${state.memories.length} items)`);
    if (state.memories.length === 0) lines.push("(nothing yet)");
    for (const m of state.memories) lines.push(`- [${m.id}] ${m.text}`);
  } else {
    lines.push("# Memory: off (do not save anything)");
  }

  if (settings.areas.includes("skola")) {
    const { school } = state;
    lines.push("");
    lines.push(`# School schedule (packing list reminds at ${school.packTime} the evening before and ${school.morningTime} in the morning)`);
    for (let d = 1; d <= 5; d++) {
      const names = (school.schedule[d] ?? []).map((id) => school.subjects.find((s) => s.id === id)?.name).filter(Boolean);
      lines.push(`- ${WEEKDAYS[d]}: ${names.join(", ") || "(nothing)"}`);
    }
    lines.push("Subjects and what to bring:");
    for (const s of school.subjects) lines.push(`- ${s.name}: ${s.items.join(", ") || "(nothing)"}`);
  }

  return lines.join("\n");
}
