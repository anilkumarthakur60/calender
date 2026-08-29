import type { CalendarSystem } from '../calendar';
import type { CalendarDate } from './calendar-date.js';

export interface PeriodCell {
  /** Canonical date representing the period (1st of month / Jan 1 of year / Jan 1 of decade start). */
  readonly date: CalendarDate;
  /** Short label ("Apr", "2025", "2020s"). */
  readonly label: string;
  /** Long label ("April", "2025", "2020 - 2029")  used for aria-label. */
  readonly longLabel: string;
  /** True when this cell represents the currently-focused period. */
  readonly isFocused: boolean;
  /** True when this cell is the user's "today" period. */
  readonly isToday: boolean;
  /** True when this cell falls outside the visible decade/century band (year/decade views only). */
  readonly outside: boolean;
}

export interface PeriodGrid {
  readonly view: 'month' | 'year' | 'decade';
  /** Range-style title for the header, e.g. "2020 - 2029" or "2025". */
  readonly title: string;
  readonly cells: ReadonlyArray<PeriodCell>;
}

const decadeStart = (year: number): number => Math.floor(year / 10) * 10;
const centuryStart = (year: number): number => Math.floor(year / 100) * 100;

export const buildPeriodGrid = (
  focused: CalendarDate,
  view: 'month' | 'year' | 'decade',
  calendar: CalendarSystem,
  locale: string,
): PeriodGrid => {
  const today = calendar.today();

  if (view === 'month') {
    const cells: PeriodCell[] = [];
    for (let m = 1; m <= calendar.monthsInYear; m += 1) {
      const cellDate: CalendarDate = { year: focused.year, month: m, day: 1 };
      cells.push(
        Object.freeze({
          date: cellDate,
          label: calendar.monthName(m, 'short', locale),
          longLabel: calendar.monthName(m, 'long', locale),
          isFocused: m === focused.month,
          isToday: today.year === focused.year && today.month === m,
          outside: false,
        }),
      );
    }
    return Object.freeze({
      view,
      title: calendar.formatDay(focused.year, locale),
      cells: Object.freeze(cells),
    });
  }

  if (view === 'year') {
    const start = decadeStart(focused.year);
    const cells: PeriodCell[] = [];
    // 12 cells: one buffer before decade, 10 years of decade, one after
    for (let i = -1; i <= 10; i += 1) {
      const y = start + i;
      const cellDate: CalendarDate = { year: y, month: 1, day: 1 };
      const text = calendar.formatDay(y, locale);
      cells.push(
        Object.freeze({
          date: cellDate,
          label: text,
          longLabel: text,
          isFocused: y === focused.year,
          isToday: y === today.year,
          outside: i < 0 || i > 9,
        }),
      );
    }
    return Object.freeze({
      view,
      title: `${calendar.formatDay(start, locale)} – ${calendar.formatDay(start + 9, locale)}`,
      cells: Object.freeze(cells),
    });
  }

  // decade
  const start = centuryStart(focused.year);
  const cells: PeriodCell[] = [];
  for (let i = -1; i <= 10; i += 1) {
    const yStart = start + i * 10;
    const cellDate: CalendarDate = { year: yStart, month: 1, day: 1 };
    const text = `${calendar.formatDay(yStart, locale)}s`;
    const longText = `${calendar.formatDay(yStart, locale)} – ${calendar.formatDay(yStart + 9, locale)}`;
    cells.push(
      Object.freeze({
        date: cellDate,
        label: text,
        longLabel: longText,
        isFocused: yStart === decadeStart(focused.year),
        isToday: yStart === decadeStart(today.year),
        outside: i < 0 || i > 9,
      }),
    );
  }
  return Object.freeze({
    view: 'decade',
    title: `${calendar.formatDay(start, locale)} – ${calendar.formatDay(start + 99, locale)}`,
    cells: Object.freeze(cells),
  });
};
