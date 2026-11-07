import { AREAS, NAG_LEVELS, REPEATS } from "../areas";
import { dayKey, formatTime, WEEKDAYS } from "../dates";
import type { AppState } from "../types";

function localStamp(d: Date): string {
  return `${dayKey(d)}T${formatTime(d)}`;
}

/** Text om användarens situation som skickas med varje meddelande */
export function buildContext(state: AppState, now: Date = new Date()): string {
  const { settings } = state;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lines: string[] = [];

  lines.push("# Aktuell situation");
  lines.push(`Nu: ${WEEKDAYS[now.getDay()].toLowerCase()} ${localStamp(now)} (tidszon ${tz})`);
  lines.push("Kommande 7 dagar:");
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    lines.push(`- ${WEEKDAYS[d.getDay()]} ${dayKey(d)}${i === 0 ? " (idag)" : i === 1 ? " (imorgon)" : ""}`);
  }
  lines.push("");
  lines.push("# Användaren");
  lines.push(`Namn: ${settings.name || "(okänt)"}`);
  lines.push(`Önskad ton: ${settings.tone}`);
  lines.push(`Aktiva områden: ${settings.areas.map((a) => AREAS[a].label.toLowerCase()).join(", ")}`);
  if (settings.areas.includes("jobb")) {
    const days = settings.workHours.days.map((d) => WEEKDAYS[d].slice(0, 3).toLowerCase()).join(", ");
    lines.push(`Arbetstid: ${settings.workHours.start}–${settings.workHours.end} (${days})`);
  }

  const active = state.reminders
    .filter((r) => !r.done && settings.areas.includes(r.area))
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 80);
  lines.push("");
  lines.push(`# Aktiva påminnelser (${active.length})`);
  if (active.length === 0) lines.push("(inga)");
  for (const r of active) {
    const extra = [
      r.repeat !== "ingen" ? REPEATS[r.repeat].toLowerCase() : null,
      `tjat: ${NAG_LEVELS[r.nag].label.toLowerCase()}`,
      new Date(r.due) <= now ? "FÖRSENAD" : null,
    ]
      .filter(Boolean)
      .join(", ");
    lines.push(`- [${r.id}] ${r.title} | ${localStamp(new Date(r.due))} | ${r.area} | ${extra}${r.notes ? ` | ${r.notes}` : ""}`);
  }

  const doneRecent = state.reminders
    .filter((r) => r.done && r.doneAt && now.getTime() - new Date(r.doneAt).getTime() < 3 * 86400000)
    .slice(-15);
  if (doneRecent.length) {
    lines.push("");
    lines.push("# Klart senaste dagarna");
    for (const r of doneRecent) lines.push(`- [${r.id}] ${r.title}`);
  }

  const routines = state.routines.filter((r) => settings.areas.includes(r.area));
  lines.push("");
  lines.push("# Rutiner/checklistor");
  if (routines.length === 0) lines.push("(inga)");
  for (const r of routines) {
    const days = r.days
      .slice()
      .sort()
      .map((d) => WEEKDAYS[d].slice(0, 3).toLowerCase())
      .join(", ");
    lines.push(`- [${r.id}] ${r.emoji} ${r.name} | ${days} kl ${r.time} | ${r.area} | ${r.items.map((i) => i.text).join(", ")}`);
  }

  if (settings.areas.includes("skola")) {
    const { school } = state;
    lines.push("");
    lines.push(
      `# Skolschema (packlista påminner ${school.packTime} kvällen innan och ${school.morningTime} på morgonen)`,
    );
    for (let d = 1; d <= 5; d++) {
      const names = (school.schedule[d] ?? [])
        .map((id) => school.subjects.find((s) => s.id === id)?.name)
        .filter(Boolean);
      lines.push(`- ${WEEKDAYS[d]}: ${names.join(", ") || "(inget)"}`);
    }
    lines.push("Ämnen och vad som ska med:");
    for (const s of school.subjects) lines.push(`- ${s.name}: ${s.items.join(", ") || "(inget)"}`);
  }

  return lines.join("\n");
}
