import { type CalendarSystem, GregorianCalendar } from '../calendar';
import type { CalendarDate } from './calendar-date.js';
import { isoWeekOfYear } from './iso-week.js';

export type WeekdayStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MonthGridCell {
  readonly date: CalendarDate;
  readonly inCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isWeekend: boolean;
  /**
   * True for filler cells that fall outside the calendar system's supported
   * year range (only reachable on table-driven calendars such as Bikram
   * Sambat, at the very first and last supported month). `date` is a
   * placeholder on these  renderers should draw them blank and unselectable.
   */
  readonly outOfRange?: boolean;
}

export interface MonthGrid {
  readonly month: number;
  readonly year: number;
  readonly weeks: ReadonlyArray<ReadonlyArray<MonthGridCell>>;
  readonly weekdayHeaders: ReadonlyArray<number>;
  /**
   * ISO week number per row (index-aligned with `weeks`), taken from each
   * row's Thursday per ISO 8601. Present only when the `weekNumbers` option
   * is on.
   */
  readonly weekNumbers?: ReadonlyArray<number>;
}

export interface MonthGridOptions {
  /** First day of week: 0 = Sunday, 1 = Monday, … */
  readonly firstDayOfWeek: WeekdayStart;
  /** Always emit 6 weeks (42 cells) for stable layout. Default: true. */
  readonly fixedWeeks: boolean;
  /** Reference for "today" highlight, defaulting to system today. */
  readonly today?: CalendarDate;
  /** Weekday indexes treated as weekend (0..6). Default: [0, 6]. */
  readonly weekendDays?: ReadonlyArray<number>;
  /** Calendar system to interpret arithmetic in. Defaults to Gregorian. */
  readonly calendar?: CalendarSystem;
  /** Compute an ISO week number per row (exposed as `grid.weekNumbers`). */
  readonly weekNumbers?: boolean;
}

const DEFAULT_OPTIONS: Required<Omit<MonthGridOptions, 'today' | 'calendar'>> = {
  firstDayOfWeek: 0,
  fixedWeeks: true,
  weekendDays: [0, 6],
  weekNumbers: false,
};

export const buildMonthGrid = (
  focusedMonth: CalendarDate,
  options: Partial<MonthGridOptions> = {},
): MonthGrid => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const calendar: CalendarSystem = options.calendar ?? new GregorianCalendar();

  const firstOfMonth: CalendarDate = { year: focusedMonth.year, month: focusedMonth.month, day: 1 };
  const firstWeekday = calendar.weekday(firstOfMonth);
  const offset = (firstWeekday - opts.firstDayOfWeek + 7) % 7;

  /**
   * Table-driven calendars (Bikram Sambat) throw outside their supported
   * years, and the leading/trailing filler of the first and last supported
   * month falls exactly there. Return null instead of letting it escape  the
   * grid keeps its shape and the cell is flagged `outOfRange`.
   */
  const safeAdd = (days: number): CalendarDate | null => {
    try {
      return calendar.addDays(firstOfMonth, days);
    } catch {
      return null;
    }
  };

  const totalCells = opts.fixedWeeks
    ? 42
    : Math.ceil((offset + calendar.daysInMonth(focusedMonth.year, focusedMonth.month)) / 7) * 7;

  const today = opts.today ?? calendar.today();
  const weekendSet = new Set(opts.weekendDays);

  const weeks: MonthGridCell[][] = [];
  let currentWeek: MonthGridCell[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const resolved = safeAdd(i - offset);
    const date = resolved ?? firstOfMonth;
    const cell: MonthGridCell = Object.freeze({
      date,
      inCurrentMonth:
        resolved !== null && date.year === focusedMonth.year && date.month === focusedMonth.month,
      isToday:
        resolved !== null &&
        date.year === today.year &&
        date.month === today.month &&
        date.day === today.day,
      isWeekend: resolved !== null && weekendSet.has(calendar.weekday(date)),
      ...(resolved === null ? { outOfRange: true as const } : {}),
    });
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => (opts.firstDayOfWeek + i) % 7);

  // Week numbers are ISO/Gregorian by definition  project non-Gregorian cells.
  // The ISO week of a row is the week containing its THURSDAY; the row's first
  // cell is only the ISO Monday when firstDayOfWeek is 1, so indexing [0] made
  // every number wrong for the (default) Sunday start.
  const thursdayIndex = (4 - opts.firstDayOfWeek + 7) % 7;
  const weekNumbers = opts.weekNumbers
    ? weeks.map(w => isoWeekOfYear(calendar.toGregorian((w[thursdayIndex] as MonthGridCell).date)))
    : undefined;

  return Object.freeze({
    month: focusedMonth.month,
    year: focusedMonth.year,
    weeks: Object.freeze(weeks.map(w => Object.freeze(w))),
    weekdayHeaders: Object.freeze(weekdayHeaders),
    ...(weekNumbers ? { weekNumbers: Object.freeze(weekNumbers) } : {}),
  });
};
