import type { CalendarDate } from '../domain';

export type CalendarId = 'gregorian' | 'bikram-sambat' | 'buddhist' | 'persian';

/**
 * Abstract calendar system. All date math operates on plain {year, month, day}
 * triples interpreted in the system's own calendar. Conversion is always
 * through Gregorian as a canonical "world" reference (weekdays are universal).
 *
 * To add a new calendar (Hijri, Buddhist, …) implement this interface and
 * register it with the factory. The engine, grid, and formatter all flow
 * through this abstraction — no other code needs to change.
 */
export interface CalendarSystem {
  readonly id: 'gregorian' | 'bikram-sambat' | 'buddhist' | 'persian';
  /** Human-readable name, e.g. "Gregorian", "Bikram Sambat". */
  readonly displayName: string;
  /** Always 12 for the two calendars shipped here; left abstract for future systems. */
  readonly monthsInYear: number;

  daysInMonth(year: number, month: number): number;
  isValidDate(year: number, month: number, day: number): boolean;

  addDays(date: CalendarDate, days: number): CalendarDate;
  addMonths(date: CalendarDate, months: number): CalendarDate;
  addYears(date: CalendarDate, years: number): CalendarDate;

  compare(a: CalendarDate, b: CalendarDate): number;
  /** US weekday (0=Sun..6=Sat). Always derived through Gregorian since the week is universal. */
  weekday(date: CalendarDate): number;

  /** Today, in this calendar system. */
  today(timeZone?: string): CalendarDate;

  /** Convert a date in this calendar to the Gregorian system. */
  toGregorian(date: CalendarDate): CalendarDate;
  /** Convert a Gregorian date to this calendar's representation. */
  fromGregorian(date: CalendarDate): CalendarDate;

  /** Localized month name. Locale is a BCP-47 tag; calendars may ignore it if irrelevant. */
  monthName(month: number, style: 'long' | 'short' | 'narrow', locale: string): string;
  /** Format a single day value (e.g. "15" or "१५" for BS+Devanagari). */
  formatDay(day: number, locale: string): string;
  /** Format the full date as a plain ASCII fallback ("YYYY-MM-DD"). */
  toIso(date: CalendarDate): string;
}
