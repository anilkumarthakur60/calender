import {
  type CalendarDate,
  fromEpochDay,
  toEpochDay,
  todayCalendarDate as todayGregorian,
  usWeekday,
} from '../domain';
import type { CalendarSystem } from './calendar-system.js';
import { GregorianCalendar } from './gregorian-calendar.js';
import {
  BS_EPOCH_GREGORIAN,
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTH_DAYS,
  BS_MONTH_NAMES_EN,
  BS_MONTH_NAMES_NE,
  toDevanagariDigits,
} from './bikram-sambat-data.js';

/**
 * BS dates can have day-of-month up to 32, which the strict Gregorian
 * {@link createCalendarDate} rejects. So BS constructs its triples directly.
 */
const makeBsDate = (year: number, month: number, day: number): CalendarDate =>
  Object.freeze({ year, month, day });

const assertInRange = (year: number): void => {
  if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) {
    throw new RangeError(
      `Bikram Sambat year ${year} out of supported range (${BS_MIN_YEAR}-${BS_MAX_YEAR}). ` +
        `Extend BS_MONTH_DAYS to add more years.`,
    );
  }
};

const monthDays = (year: number, month: number): number => {
  assertInRange(year);
  if (month < 1 || month > 12) throw new RangeError(`Invalid BS month: ${month}`);
  const row = BS_MONTH_DAYS[year];
  if (!row) throw new RangeError(`No BS data for year ${year}`);
  const days = row[month - 1];
  if (days === undefined) throw new RangeError(`No BS data for year ${year} month ${month}`);
  return days;
};

/**
 * Count days from BS 1970-01-01 to the given BS date (exclusive of start).
 * Used as the canonical "days since epoch" for conversion to/from Gregorian.
 */
const bsDaysFromEpoch = (date: CalendarDate): number => {
  let total = 0;
  for (let y = BS_MIN_YEAR; y < date.year; y += 1) {
    const row = BS_MONTH_DAYS[y];
    if (!row) throw new RangeError(`Missing BS data for year ${y}`);
    for (const d of row) total += d;
  }
  for (let m = 1; m < date.month; m += 1) total += monthDays(date.year, m);
  total += date.day - 1;
  return total;
};

const bsFromDaysSinceEpoch = (days: number): CalendarDate => {
  if (days < 0)
    throw new RangeError(`BS date before epoch (${days} days). Outside supported range.`);
  let remaining = days;
  let year = BS_MIN_YEAR;
  while (year <= BS_MAX_YEAR) {
    const row = BS_MONTH_DAYS[year];
    if (!row) throw new RangeError(`Missing BS data for year ${year}`);
    const yearTotal = row.reduce((s, d) => s + d, 0);
    if (remaining < yearTotal) break;
    remaining -= yearTotal;
    year += 1;
  }
  if (year > BS_MAX_YEAR) {
    throw new RangeError(`BS date after BS ${BS_MAX_YEAR}. Extend BS_MONTH_DAYS.`);
  }
  let month = 1;
  while (month <= 12) {
    const m = monthDays(year, month);
    if (remaining < m) break;
    remaining -= m;
    month += 1;
  }
  return makeBsDate(year, month, remaining + 1);
};

export class BikramSambatCalendar implements CalendarSystem {
  readonly id = 'bikram-sambat' as const;
  readonly displayName = 'Bikram Sambat';
  readonly monthsInYear = 12;

  daysInMonth(year: number, month: number): number {
    return monthDays(year, month);
  }

  isValidDate(year: number, month: number, day: number): boolean {
    if (year < BS_MIN_YEAR || year > BS_MAX_YEAR) return false;
    if (month < 1 || month > 12) return false;
    return day >= 1 && day <= monthDays(year, month);
  }

  addDays(date: CalendarDate, days: number): CalendarDate {
    if (days === 0) return date;
    return bsFromDaysSinceEpoch(bsDaysFromEpoch(date) + days);
  }

  addMonths(date: CalendarDate, months: number): CalendarDate {
    if (months === 0) return date;
    const total = date.month - 1 + months;
    const yearDelta = Math.floor(total / 12);
    const newYear = date.year + yearDelta;
    const newMonth = (((total % 12) + 12) % 12) + 1;
    assertInRange(newYear);
    const newDay = Math.min(date.day, monthDays(newYear, newMonth));
    return makeBsDate(newYear, newMonth, newDay);
  }

  addYears(date: CalendarDate, years: number): CalendarDate {
    return this.addMonths(date, years * 12);
  }

  compare(a: CalendarDate, b: CalendarDate): number {
    if (a.year !== b.year) return a.year - b.year;
    if (a.month !== b.month) return a.month - b.month;
    return a.day - b.day;
  }

  weekday(date: CalendarDate): number {
    return usWeekday(this.toGregorian(date));
  }

  today(timeZone?: string): CalendarDate {
    return this.fromGregorian(todayGregorian(timeZone));
  }

  toGregorian(date: CalendarDate): CalendarDate {
    // Pure UTC epoch-day arithmetic: identical result in every host time zone
    // (local-time Date math shifted a day across the Samoa 2011 dateline jump).
    return fromEpochDay(toEpochDay(BS_EPOCH_GREGORIAN) + bsDaysFromEpoch(date));
  }

  fromGregorian(date: CalendarDate): CalendarDate {
    const days = GregorianCalendar.daysBetween(BS_EPOCH_GREGORIAN, date);
    return bsFromDaysSinceEpoch(days);
  }

  monthName(month: number, style: 'long' | 'short' | 'narrow', locale: string): string {
    const isNepali = locale.startsWith('ne');
    const names = isNepali ? BS_MONTH_NAMES_NE : BS_MONTH_NAMES_EN;
    const idx = month - 1;
    if (idx < 0 || idx >= names.length) return String(month);
    const full = names[idx] as string;
    if (style === 'narrow') return full.slice(0, 1);
    if (style === 'short') return full.slice(0, 3);
    return full;
  }

  formatDay(day: number, locale: string): string {
    if (locale.startsWith('ne')) return toDevanagariDigits(day);
    return String(day);
  }

  toIso(date: CalendarDate): string {
    const m = String(date.month).padStart(2, '0');
    const d = String(date.day).padStart(2, '0');
    return `${date.year}-${m}-${d}`;
  }
}
