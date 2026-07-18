import type { CalendarDate } from '../domain';
import type { DatePickerEngine } from './date-picker-engine.js';

/**
 * A named action shown in the picker's footer. Built-ins are resolved by id;
 * users can supply custom presets via the same shape.
 */
export interface DatePreset {
  readonly id: string;
  readonly label: string;
  readonly apply: (engine: DatePickerEngine) => void;
}

export type PresetSpec = string | DatePreset;

// Atomic range application: clamps into min/max and applies nothing when the
// clamped range is empty — no dangling anchor from a half-applied preset.
const selectRange = (engine: DatePickerEngine, start: CalendarDate, end: CalendarDate): void => {
  engine.selectRange(start, end);
};

// The engine's tz-aware today (honours locale.timeZone).
const today = (engine: DatePickerEngine): CalendarDate => engine.today();

export const BUILTIN_PRESETS: Readonly<Record<string, DatePreset>> = {
  today: {
    id: 'today',
    label: 'Today',
    apply: e => {
      if (e.state.selection.mode === 'range') selectRange(e, today(e), today(e));
      else e.selectToday();
    },
  },
  yesterday: {
    id: 'yesterday',
    label: 'Yesterday',
    apply: e => {
      const d = e.calendar.addDays(today(e), -1);
      if (e.state.selection.mode === 'range') selectRange(e, d, d);
      else {
        e.focus(d);
        e.select(d);
      }
    },
  },
  tomorrow: {
    id: 'tomorrow',
    label: 'Tomorrow',
    apply: e => {
      const d = e.calendar.addDays(today(e), 1);
      e.focus(d);
      if (e.state.selection.mode === 'range') selectRange(e, d, d);
      else e.select(d);
    },
  },
  last7days: {
    id: 'last7days',
    label: 'Last 7 days',
    apply: e => {
      const end = today(e);
      const start = e.calendar.addDays(end, -6);
      selectRange(e, start, end);
    },
  },
  last30days: {
    id: 'last30days',
    label: 'Last 30 days',
    apply: e => {
      const end = today(e);
      const start = e.calendar.addDays(end, -29);
      selectRange(e, start, end);
    },
  },
  last90days: {
    id: 'last90days',
    label: 'Last 90 days',
    apply: e => {
      const end = today(e);
      const start = e.calendar.addDays(end, -89);
      selectRange(e, start, end);
    },
  },
  thisWeek: {
    id: 'thisWeek',
    label: 'This week',
    apply: e => {
      const t = today(e);
      const wd = e.calendar.weekday(t);
      const offset = (wd - e.locale.firstDayOfWeek + 7) % 7;
      const start = e.calendar.addDays(t, -offset);
      const end = e.calendar.addDays(start, 6);
      selectRange(e, start, end);
    },
  },
  thisMonth: {
    id: 'thisMonth',
    label: 'This month',
    apply: e => {
      const t = today(e);
      const start: CalendarDate = { year: t.year, month: t.month, day: 1 };
      const end: CalendarDate = {
        year: t.year,
        month: t.month,
        day: e.calendar.daysInMonth(t.year, t.month),
      };
      selectRange(e, start, end);
    },
  },
  lastMonth: {
    id: 'lastMonth',
    label: 'Last month',
    apply: e => {
      const t = today(e);
      const prev = e.calendar.addMonths({ year: t.year, month: t.month, day: 1 }, -1);
      const start: CalendarDate = { year: prev.year, month: prev.month, day: 1 };
      const end: CalendarDate = {
        year: prev.year,
        month: prev.month,
        day: e.calendar.daysInMonth(prev.year, prev.month),
      };
      selectRange(e, start, end);
    },
  },
  thisYear: {
    id: 'thisYear',
    label: 'This year',
    apply: e => {
      const t = today(e);
      const start: CalendarDate = { year: t.year, month: 1, day: 1 };
      const end: CalendarDate = {
        year: t.year,
        month: e.calendar.monthsInYear,
        day: e.calendar.daysInMonth(t.year, e.calendar.monthsInYear),
      };
      selectRange(e, start, end);
    },
  },
  clear: {
    id: 'clear',
    label: 'Clear',
    apply: e => e.clearSelection(),
  },
};

export const resolvePreset = (spec: PresetSpec): DatePreset | null => {
  if (typeof spec === 'string') return BUILTIN_PRESETS[spec] ?? null;
  return spec;
};

export const resolvePresets = (specs: ReadonlyArray<PresetSpec>): ReadonlyArray<DatePreset> =>
  specs.map(resolvePreset).filter((p): p is DatePreset => p !== null);
