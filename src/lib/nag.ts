import { atTime, minutesBetween } from "./dates";
import type { AreaId, NagLevel, Settings } from "./types";

/** Minutes between nags after the first notification, per level */
const INTERVALS: Record<Exclude<NagLevel, "av">, (count: number) => number | null> = {
  mild: () => null, // only once
  normal: (count) => (count === 1 ? 15 : 60),
  mamma: () => 10,
};

/**
 * Works out when the next notification should go out, or null if no more should.
 * `start` = when the first notification should go out (due time).
 */
export function nextNagAt(opts: {
  level: NagLevel;
  start: Date;
  nagCount: number;
  lastNotifiedAt?: string;
  snoozedUntil?: string;
}): Date | null {
  const { level, start, nagCount, lastNotifiedAt, snoozedUntil } = opts;
  if (level === "av") return null;

  let next: Date | null;
  if (nagCount === 0 || !lastNotifiedAt) {
    next = start;
  } else {
    const gap = INTERVALS[level](nagCount);
    if (gap === null) {
      next = null;
    } else {
      next = new Date(new Date(lastNotifiedAt).getTime() + gap * 60000);
    }
  }

  if (snoozedUntil) {
    const s = new Date(snoozedUntil);
    // A snooze always gives a new notification when it runs out, even on "mild"
    if (!next || s > next) next = s;
  }
  return next;
}

export function isWithinWorkHours(settings: Settings, now: Date): boolean {
  const { start, end, days } = settings.workHours;
  if (!days.includes(now.getDay())) return false;
  return now >= atTime(now, start) && now < atTime(now, end);
}

/** Should notifications for this area be held back right now? */
export function isQuiet(area: AreaId, settings: Settings, now: Date): boolean {
  return area === "jobb" && settings.quietWorkOutsideHours && !isWithinWorkHours(settings, now);
}

/** Short description of when the reminder nags next (for the UI) */
export function describeNext(next: Date | null, now: Date): string | null {
  if (!next) return null;
  const mins = Math.round(minutesBetween(now, next));
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${mins} min`;
  return `in ${Math.round(mins / 60)} h`;
}
