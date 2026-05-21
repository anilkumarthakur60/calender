import type { CalendarDate } from '../domain/calendar-date.js';
import { toJsDate } from '../domain/calendar-date.js';
import type { LocaleConfig } from './locale-config.js';

/**
 * Wraps `Intl.DateTimeFormat` with internal memoisation. Same options reused
 * across thousands of cells must not allocate a new formatter per cell.
 */
export class DateFormatter {
  readonly #cache = new Map<string, Intl.DateTimeFormat>();

  constructor(private readonly config: LocaleConfig) {}

  format(date: CalendarDate, options: Intl.DateTimeFormatOptions): string {
    return this.#formatter(options).format(toJsDate(date));
  }

  formatDay(date: CalendarDate): string {
    return this.format(date, { day: 'numeric' });
  }

  formatWeekday(weekdayIndex: number, style: 'narrow' | 'short' | 'long' = 'short'): string {
    const ref = new Date(2024, 0, 7 + weekdayIndex);
    return this.#formatter({ weekday: style }).format(ref);
  }

  formatMonth(
    date: CalendarDate,
    style: 'numeric' | '2-digit' | 'long' | 'short' | 'narrow' = 'long',
  ): string {
    return this.format(date, { month: style });
  }

  formatMonthYear(date: CalendarDate): string {
    return this.format(date, { year: 'numeric', month: 'long' });
  }

  formatFull(date: CalendarDate): string {
    return this.format(date, { dateStyle: 'full' });
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
