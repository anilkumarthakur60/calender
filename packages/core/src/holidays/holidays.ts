import type { CalendarDate } from '../domain/calendar-date.js';
import { addDays, usWeekday } from '../domain/calendar-date.js';
import type { DateHighlight } from '../engine/engine-options.js';

/**
 * Per-country holiday calendars. Tree-shakeable — import only the function for
 * the country you need. Each entry is `(year) → ReadonlyArray<DateHighlight>`
 * so consumers can drop it straight into the engine's `highlights` option.
 *
 * The functions compute holidays on demand rather than hard-coding a fixed
 * year range, so they work for any year. Fixed-date holidays are returned
 * verbatim; movable ones (Easter, US "Monday after first weekend in $month")
 * use the standard rules.
 *
 * These are starter sets — public holidays only. Add bank holidays /
 * regional / religious variants by composing the output array.
 */

const fixed = (
  year: number,
  month: number,
  day: number,
  label: string,
  color?: string,
): DateHighlight => ({
  date: { year, month, day },
  label,
  ...(color !== undefined ? { color } : {}),
});

/** Nth weekday of a month — e.g. nthWeekdayOf(2025, 11, 4, 1) = 4th Thursday of November. */
const nthWeekdayOf = (year: number, month: number, weekday: number, nth: number): CalendarDate => {
  const first: CalendarDate = { year, month, day: 1 };
  const firstWeekday = usWeekday(first);
  const offset = (weekday - firstWeekday + 7) % 7;
  return addDays(first, offset + (nth - 1) * 7);
};

/** Last weekday of a month — e.g. lastWeekdayOf(2025, 5, 1) = last Monday of May. */
const lastWeekdayOf = (year: number, month: number, weekday: number): CalendarDate => {
  // Walk back from day 31 (or month-end) to find the last instance.
  const monthEnd =
    month === 12 ? { year: year + 1, month: 1, day: 1 } : { year, month: month + 1, day: 1 };
  const lastDayOfMonth = addDays(monthEnd, -1);
  const lastDayWeekday = usWeekday(lastDayOfMonth);
  const offset = (lastDayWeekday - weekday + 7) % 7;
  return addDays(lastDayOfMonth, -offset);
};

/**
 * US federal holidays. Observed-on-Monday rules NOT applied — these are the
 * actual dates. Apply observance shifts in your app if you need them.
 */
export const usHolidays = (year: number): ReadonlyArray<DateHighlight> => [
  fixed(year, 1, 1, "New Year's Day", '#dc2626'),
  { date: nthWeekdayOf(year, 1, 1, 3), label: 'MLK Day' }, // 3rd Monday Jan
  { date: nthWeekdayOf(year, 2, 1, 3), label: "Presidents' Day" }, // 3rd Monday Feb
  { date: lastWeekdayOf(year, 5, 1), label: 'Memorial Day', color: '#dc2626' },
  fixed(year, 6, 19, 'Juneteenth'),
  fixed(year, 7, 4, 'Independence Day', '#3b82f6'),
  { date: nthWeekdayOf(year, 9, 1, 1), label: 'Labor Day' }, // 1st Monday Sep
  { date: nthWeekdayOf(year, 10, 1, 2), label: 'Columbus Day' }, // 2nd Monday Oct
  fixed(year, 11, 11, 'Veterans Day'),
  { date: nthWeekdayOf(year, 11, 4, 4), label: 'Thanksgiving', color: '#f59e0b' }, // 4th Thursday Nov
  fixed(year, 12, 25, 'Christmas', '#16a34a'),
];

/**
 * UK bank holidays (England & Wales). Easter Monday / Good Friday computed
 * via Meeus's Anonymous Gregorian algorithm.
 */
export const ukHolidays = (year: number): ReadonlyArray<DateHighlight> => {
  const easter = easterSunday(year);
  return [
    fixed(year, 1, 1, "New Year's Day"),
    { date: addDays(easter, -2), label: 'Good Friday' },
    { date: addDays(easter, 1), label: 'Easter Monday' },
    { date: nthWeekdayOf(year, 5, 1, 1), label: 'Early May bank holiday' }, // 1st Monday May
    { date: lastWeekdayOf(year, 5, 1), label: 'Spring bank holiday' }, // last Monday May
    { date: lastWeekdayOf(year, 8, 1), label: 'Summer bank holiday' }, // last Monday Aug
    fixed(year, 12, 25, 'Christmas Day', '#16a34a'),
    fixed(year, 12, 26, 'Boxing Day'),
  ];
};

/**
 * Nepal federal holidays — date-fixed approximations. Many Nepali holidays
 * follow the Bikram Sambat or Nepal Sambat calendars; this is a Gregorian
 * approximation suitable for highlighting.
 */
export const npHolidays = (year: number): ReadonlyArray<DateHighlight> => [
  fixed(year, 1, 1, "New Year's Day"),
  fixed(year, 1, 11, 'Prithvi Jayanti'),
  fixed(year, 1, 30, 'Martyrs Day'),
  fixed(year, 2, 19, 'Democracy Day'),
  fixed(year, 4, 14, 'Nepali New Year (Baishakh 1)', '#dc2626'),
  fixed(year, 5, 1, 'Labour Day'),
  fixed(year, 5, 28, 'Republic Day'),
  fixed(year, 9, 20, 'Constitution Day'),
];

// --- Easter (Western, Meeus algorithm) ----------------------------------
const easterSunday = (year: number): CalendarDate => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  return { year, month, day };
};

/** Compose multiple holiday sources into a single highlights array. */
export const composeHolidays = (
  ...sources: ReadonlyArray<ReadonlyArray<DateHighlight>>
): ReadonlyArray<DateHighlight> => sources.flat();
