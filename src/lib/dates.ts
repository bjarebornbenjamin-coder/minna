export const WEEKDAYS = ["Söndag", "Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag", "Lördag"];
export const WEEKDAYS_SHORT = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"];

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function atTime(d: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(":").map(Number);
  const x = new Date(d);
  x.setHours(h || 0, m || 0, 0, 0);
  return x;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function formatTime(d: Date): string {
  return d.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" });
}

/** "Idag 14:00", "Imorgon 07:30", "Fre 12 nov 09:00" */
export function formatDue(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const t = formatTime(d);
  if (isSameDay(d, now)) return `Idag ${t}`;
  if (isSameDay(d, addDays(now, 1))) return `Imorgon ${t}`;
  if (isSameDay(d, addDays(now, -1))) return `Igår ${t}`;
  const date = d.toLocaleDateString("sv-SE", { weekday: "short", day: "numeric", month: "short" });
  return `${date} ${t}`;
}

/** Värde för <input type="datetime-local"> */
export function toLocalInput(d: Date): string {
  return `${dayKey(d)}T${formatTime(d)}`;
}

export function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000;
}
