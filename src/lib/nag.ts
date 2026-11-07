import { atTime, minutesBetween } from "./dates";
import type { AreaId, NagLevel, Settings } from "./types";

/** Minuter mellan tjat efter första notisen, per nivå */
const INTERVALS: Record<Exclude<NagLevel, "av">, (count: number) => number | null> = {
  mild: () => null, // bara en gång
  normal: (count) => (count === 1 ? 15 : 60),
  mamma: () => 10,
};

/**
 * Räknar ut när nästa notis ska skickas, eller null om inga fler notiser ska gå.
 * `start` = när första notisen ska gå (förfallotid).
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
    // En snooze ger alltid en ny notis när den går ut, även på "mild"
    if (!next || s > next) next = s;
  }
  return next;
}

export function isWithinWorkHours(settings: Settings, now: Date): boolean {
  const { start, end, days } = settings.workHours;
  if (!days.includes(now.getDay())) return false;
  return now >= atTime(now, start) && now < atTime(now, end);
}

/** Ska notiser för detta område hållas tillbaka just nu? */
export function isQuiet(area: AreaId, settings: Settings, now: Date): boolean {
  return area === "jobb" && settings.quietWorkOutsideHours && !isWithinWorkHours(settings, now);
}

/** Kort förklaring av när påminnelsen tjatar nästa gång (för UI) */
export function describeNext(next: Date | null, now: Date): string | null {
  if (!next) return null;
  const mins = Math.round(minutesBetween(now, next));
  if (mins <= 0) return "nu";
  if (mins < 60) return `om ${mins} min`;
  return `om ${Math.round(mins / 60)} h`;
}
