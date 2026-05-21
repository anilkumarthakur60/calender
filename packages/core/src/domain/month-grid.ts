import {
  type CalendarDate,
  addDays,
  daysInMonth,
  isSameMonth,
  startOfMonth,
  todayCalendarDate,
  usWeekday,
} from './calendar-date.js';

export type WeekdayStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface MonthGridCell {
  readonly date: CalendarDate;
  readonly inCurrentMonth: boolean;
  readonly isToday: boolean;
  readonly isWeekend: boolean;
}

export interface MonthGrid {
  readonly month: number;
  readonly year: number;
  readonly weeks: ReadonlyArray<ReadonlyArray<MonthGridCell>>;
  readonly weekdayHeaders: ReadonlyArray<number>;
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
}

const DEFAULT_OPTIONS: Required<Omit<MonthGridOptions, 'today'>> = {
  firstDayOfWeek: 0,
  fixedWeeks: true,
  weekendDays: [0, 6],
};

export const buildMonthGrid = (
  focusedMonth: CalendarDate,
  options: Partial<MonthGridOptions> = {},
): MonthGrid => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const firstOfMonth = startOfMonth(focusedMonth);
  const firstWeekday = usWeekday(firstOfMonth);
  const offset = (firstWeekday - opts.firstDayOfWeek + 7) % 7;
  const gridStart = addDays(firstOfMonth, -offset);

  const totalCells = opts.fixedWeeks
    ? 42
    : Math.ceil((offset + daysInMonth(focusedMonth.year, focusedMonth.month)) / 7) * 7;

  const today = opts.today ?? todayCalendarDate();
  const weekendSet = new Set(opts.weekendDays);

  const weeks: MonthGridCell[][] = [];
  let currentWeek: MonthGridCell[] = [];
  for (let i = 0; i < totalCells; i += 1) {
    const date = addDays(gridStart, i);
    const cell: MonthGridCell = Object.freeze({
      date,
      inCurrentMonth: isSameMonth(date, focusedMonth),
      isToday: date.year === today.year && date.month === today.month && date.day === today.day,
      isWeekend: weekendSet.has(usWeekday(date)),
    });
    currentWeek.push(cell);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  const weekdayHeaders = Array.from({ length: 7 }, (_, i) => (opts.firstDayOfWeek + i) % 7);

  return Object.freeze({
    month: focusedMonth.month,
    year: focusedMonth.year,
    weeks: Object.freeze(weeks.map(w => Object.freeze(w))),
    weekdayHeaders: Object.freeze(weekdayHeaders),
  });
};
