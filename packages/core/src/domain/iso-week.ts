import type { CalendarDate } from './calendar-date.js';

/**
 * ISO 8601 week-of-year. Week 1 is the week containing the first Thursday of
 * the year. Always derived through the Gregorian projection — the week itself
 * is universal (BS users see the same Gregorian-week label).
 *
 * Computed entirely in UTC (Date.UTC from y/m/d) so the result is identical
 * in every host time zone, including UTC+13/+14.
 */
export const isoWeekOfYear = (date: CalendarDate): number => {
  const d = new Date(Date.UTC(date.year, date.month - 1, date.day));
  const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0..Sun=6
  // Anchor: Thursday of the date's ISO week
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  return 1 + Math.round((d.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
};
