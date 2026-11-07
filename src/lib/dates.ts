export const LOCALE = "en-US";
export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

/** 24-hour "HH:MM", used for inputs and storage */
export function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Display time, e.g. "6:30 PM" */
export function formatTime(d: Date): string {
  return d.toLocaleTimeString(LOCALE, { hour: "numeric", minute: "2-digit" });
}

/** Display a stored "HH:MM" as e.g. "8:00 PM" */
export function formatClock(value: string): string {
  return formatTime(atTime(new Date(), value));
}

/** "Today 2:00 PM", "Tomorrow 7:30 AM", "Fri, Nov 12, 9:00 AM" */
export function formatDue(iso: string, now: Date = new Date()): string {
  const d = new Date(iso);
  const t = formatTime(d);
  if (isSameDay(d, now)) return `Today ${t}`;
  if (isSameDay(d, addDays(now, 1))) return `Tomorrow ${t}`;
  if (isSameDay(d, addDays(now, -1))) return `Yesterday ${t}`;
  const date = d.toLocaleDateString(LOCALE, { weekday: "short", month: "short", day: "numeric" });
  return `${date}, ${t}`;
}

/** Value for <input type="datetime-local"> */
export function toLocalInput(d: Date): string {
  return `${dayKey(d)}T${hhmm(d)}`;
}

export function minutesBetween(a: Date, b: Date): number {
  return (b.getTime() - a.getTime()) / 60000;
}
