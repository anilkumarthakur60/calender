import { type CalendarDate, createCalendarDate } from '../domain/calendar-date.js';
import type { CalendarSystem } from './calendar-system.js';
import { GregorianCalendar } from './gregorian-calendar.js';

/**
 * Thai Solar / Buddhist Era calendar. Identical to Gregorian for everything
 * EXCEPT the year, which is offset by **+543** (BE = AD + 543).
 *
 * E.g. AD 2025 = BE 2568, AD 2024-04-13 (Thai New Year week) = BE 2567-04-13.
 * Month/day arithmetic, leap years, and weekday calculation match Gregorian
 * exactly — only the year number changes.
 */
const BE_OFFSET = 543;

export class BuddhistCalendar implements CalendarSystem {
  readonly id = 'buddhist' as const;
  readonly displayName = 'Buddhist (BE)';
  readonly monthsInYear = 12;
  readonly #gregorian = new GregorianCalendar();

  daysInMonth(year: number, month: number): number {
    return this.#gregorian.daysInMonth(year - BE_OFFSET, month);
  }

  isValidDate(year: number, month: number, day: number): boolean {
    return this.#gregorian.isValidDate(year - BE_OFFSET, month, day);
  }

  addDays(date: CalendarDate, days: number): CalendarDate {
    const g = this.toGregorian(date);
    const next = this.#gregorian.addDays(g, days);
    return this.fromGregorian(next);
  }

  addMonths(date: CalendarDate, months: number): CalendarDate {
    const g = this.toGregorian(date);
    const next = this.#gregorian.addMonths(g, months);
    return this.fromGregorian(next);
  }

  addYears(date: CalendarDate, years: number): CalendarDate {
    const g = this.toGregorian(date);
    const next = this.#gregorian.addYears(g, years);
    return this.fromGregorian(next);
  }

  compare(a: CalendarDate, b: CalendarDate): number {
    return this.#gregorian.compare(a, b);
  }

  weekday(date: CalendarDate): number {
    return this.#gregorian.weekday(this.toGregorian(date));
  }

  today(timeZone?: string): CalendarDate {
    return this.fromGregorian(this.#gregorian.today(timeZone));
  }

  toGregorian(date: CalendarDate): CalendarDate {
    return createCalendarDate(date.year - BE_OFFSET, date.month, date.day);
  }

  fromGregorian(date: CalendarDate): CalendarDate {
    return createCalendarDate(date.year + BE_OFFSET, date.month, date.day);
  }

  monthName(month: number, style: 'long' | 'short' | 'narrow', locale: string): string {
    // Reuse Intl with the Thai-Buddhist calendar where the locale permits;
    // fall back to Gregorian month names if the locale doesn't support it.
    const ref = new Date(2024, month - 1, 15, 12);
    try {
      return new Intl.DateTimeFormat(locale, { month: style, calendar: 'buddhist' }).format(ref);
    } catch {
      return this.#gregorian.monthName(month, style, locale);
    }
  }

  formatDay(day: number, locale: string): string {
    return this.#gregorian.formatDay(day, locale);
  }

  toIso(date: CalendarDate): string {
    return this.#gregorian.toIso(date);
  }
}
