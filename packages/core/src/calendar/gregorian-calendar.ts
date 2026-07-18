import {
  type CalendarDate,
  addDays as gAddDays,
  addMonths as gAddMonths,
  addYears as gAddYears,
  compareDates,
  createCalendarDate,
  daysInMonth as gDaysInMonth,
  toEpochDay,
  todayCalendarDate,
  toIso as gToIso,
  usWeekday,
} from '../domain';
import type { CalendarSystem } from './calendar-system.js';

export class GregorianCalendar implements CalendarSystem {
  readonly id = 'gregorian' as const;
  readonly displayName = 'Gregorian';
  readonly monthsInYear = 12;

  daysInMonth(year: number, month: number): number {
    return gDaysInMonth(year, month);
  }

  isValidDate(year: number, month: number, day: number): boolean {
    if (month < 1 || month > 12) return false;
    return day >= 1 && day <= this.daysInMonth(year, month);
  }

  addDays(date: CalendarDate, days: number): CalendarDate {
    return gAddDays(date, days);
  }

  addMonths(date: CalendarDate, months: number): CalendarDate {
    return gAddMonths(date, months);
  }

  addYears(date: CalendarDate, years: number): CalendarDate {
    return gAddYears(date, years);
  }

  compare(a: CalendarDate, b: CalendarDate): number {
    return compareDates(a, b);
  }

  weekday(date: CalendarDate): number {
    return usWeekday(date);
  }

  today(timeZone?: string): CalendarDate {
    return todayCalendarDate(timeZone);
  }

  toGregorian(date: CalendarDate): CalendarDate {
    return date;
  }

  fromGregorian(date: CalendarDate): CalendarDate {
    return createCalendarDate(date.year, date.month, date.day);
  }

  monthName(month: number, style: 'long' | 'short' | 'narrow', locale: string): string {
    const ref = new Date(2024, month - 1, 1, 12);
    return new Intl.DateTimeFormat(locale, { month: style }).format(ref);
  }

  formatDay(day: number, locale: string): string {
    return new Intl.NumberFormat(locale, { useGrouping: false }).format(day);
  }

  toIso(date: CalendarDate): string {
    return gToIso(date);
  }

  /** Cross-calendar helper: days between two Gregorian dates, via UTC epoch-day math. */
  static daysBetween(a: CalendarDate, b: CalendarDate): number {
    return toEpochDay(b) - toEpochDay(a);
  }
}
