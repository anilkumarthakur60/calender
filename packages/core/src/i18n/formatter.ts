import { type CalendarSystem, GregorianCalendar } from '../calendar';
import type { CalendarDate } from '../domain';
import type { LocaleConfig } from './locale-config.js';

/**
 * Locale + calendar aware formatter. For Gregorian dates uses Intl.DateTimeFormat
 * directly. For non-Gregorian calendars (BS, …) it delegates formatting of the
 * year/month/day parts to the calendar system, while weekday names come from
 * Intl (since the 7-day week is universal).
 *
 * Intl.DateTimeFormat instances are memoised per option-set.
 */
export class DateFormatter {
  readonly #cache = new Map<string, Intl.DateTimeFormat>();
  readonly #calendar: CalendarSystem;

  constructor(
    private readonly config: LocaleConfig,
    calendar?: CalendarSystem,
  ) {
    this.#calendar = calendar ?? new GregorianCalendar();
  }

  formatDay(date: CalendarDate): string {
    return this.#calendar.formatDay(date.day, this.config.locale);
  }

  formatWeekday(weekdayIndex: number, style: 'narrow' | 'short' | 'long' = 'short'): string {
    const ref = new Date(2024, 0, 7 + weekdayIndex);
    return this.#formatter({ weekday: style }).format(ref);
  }

  formatMonth(
    date: CalendarDate,
    style: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' = 'long',
  ): string {
    if (style === 'numeric' || style === '2-digit') {
      const raw = this.#calendar.formatDay(date.month, this.config.locale);
      return style === '2-digit' ? raw.padStart(2, '0') : raw;
    }
    return this.#calendar.monthName(date.month, style, this.config.locale);
  }

  formatMonthYear(date: CalendarDate): string {
    return `${this.formatMonth(date, 'long')} ${this.#calendar.formatDay(date.year, this.config.locale)}`;
  }

  formatFull(date: CalendarDate): string {
    const weekday = this.formatWeekday(this.#calendar.weekday(date), 'long');
    const monthName = this.formatMonth(date, 'long');
    const day = this.#calendar.formatDay(date.day, this.config.locale);
    const year = this.#calendar.formatDay(date.year, this.config.locale);
    return `${weekday}, ${monthName} ${day}, ${year}`;
  }

  /** Underlying Intl access for callers that need raw DateTimeFormat output (Gregorian only). */
  formatIntl(date: CalendarDate, options: Intl.DateTimeFormatOptions): string {
    const greg = this.#calendar.toGregorian(date);
    const jsDate = new Date(greg.year, greg.month - 1, greg.day, 12);
    return this.#formatter(options).format(jsDate);
  }

  #formatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
    const key = JSON.stringify(options);
    let f = this.#cache.get(key);
    if (!f) {
      const opts: Intl.DateTimeFormatOptions = this.config.timeZone
        ? { ...options, timeZone: this.config.timeZone }
        : options;
      f = new Intl.DateTimeFormat(this.config.locale, opts);
      this.#cache.set(key, f);
    }
    return f;
  }
}
