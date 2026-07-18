import type { CalendarId, CalendarSystem } from '../calendar';
import type { CalendarDate } from '../domain';
import type { DateConstraint } from '../constraints';
import type { LocaleConfig } from '../i18n';
import type { ViewMode } from '../navigation';
import {
  type SelectionMode,
  type RangeSelectionOptions,
  type MultiSelectionOptions,
} from '../selection';

export interface DateHighlight {
  readonly date: CalendarDate;
  /** CSS color used for the dot. Defaults to the accent colour. */
  readonly color?: string;
  /** Tooltip / aria text appended to the cell label. */
  readonly label?: string;
}

export type SelectionGranularity = 'day' | 'month' | 'year';

/**
 * Seed value for {@link DatePickerEngineOptions.initialSelected}: a single
 * date, a `{start, end}` range, or an array of dates (multi mode).
 */
export type InitialSelected =
  | CalendarDate
  | { readonly start: CalendarDate; readonly end: CalendarDate }
  | ReadonlyArray<CalendarDate>;

export interface DatePickerEngineOptions {
  readonly mode?: SelectionMode;
  readonly initialFocused?: CalendarDate;
  readonly initialView?: ViewMode;
  /**
   * Seed the selection at construction. Shape follows `mode`: a CalendarDate
   * for `single`, `{start, end}` for `range`, `CalendarDate[]` for `multi`
   * (a bare date is also accepted for range/multi). Dates violating the
   * configured constraints are dropped. Unless `initialFocused` is given,
   * the focused date defaults near the seeded selection.
   */
  readonly initialSelected?: InitialSelected;
  readonly min?: CalendarDate;
  readonly max?: CalendarDate;
  readonly disabledDates?: ReadonlyArray<CalendarDate>;
  readonly disabledWeekdays?: ReadonlyArray<number>;
  readonly extraConstraints?: ReadonlyArray<DateConstraint>;
  readonly locale?: string | Partial<LocaleConfig>;
  readonly range?: RangeSelectionOptions;
  readonly multi?: MultiSelectionOptions;
  readonly fixedWeeks?: boolean;
  /**
   * Calendar system to operate in. Defaults to `'gregorian'` (AD).
   * Pass `'bikram-sambat'` for BS, or your own {@link CalendarSystem} instance.
   */
  readonly calendar?: CalendarId | CalendarSystem;

  // --- New feature options ----------------------------------------------

  /**
   * Granularity of the selection. `'day'` is the standard picker; `'month'`
   * starts at the months view and clicking a month selects it; `'year'` does
   * the same for years.
   */
  readonly granularity?: SelectionGranularity;
  /** Minimum number of days a range must span (inclusive). Range mode only. */
  readonly minRangeDays?: number;
  /** Maximum number of days a range may span (inclusive). Range mode only. */
  readonly maxRangeDays?: number;
  /**
   * What happens when a completing range click would span disabled dates.
   * `'allow'` (default) commits the range regardless; `'reject'` makes the
   * second click a no-op; `'clamp'` shrinks the range to the longest fully
   * enabled span reaching out from the anchor.
   */
  readonly rangeOverDisabled?: 'allow' | 'reject' | 'clamp';
  /** Per-date decorations (dots, tooltips). Cheap to evaluate — looked up by ISO key. */
  readonly highlights?: ReadonlyArray<DateHighlight>;
  /** Number of consecutive months to render. Default 1. */
  readonly months?: number;
  /** Render an ISO week-number column to the left of each grid. */
  readonly weekNumbers?: boolean;
  /** Whether the picker also chooses a time-of-day. */
  readonly withTime?: boolean;
  /** Minute step in the time picker (1, 5, 10, 15, 30). Default 1. */
  readonly timeStep?: number;
  /** Use 12-hour clock with AM/PM. Default false (24h). */
  readonly use12HourClock?: boolean;
  /** Show a seconds field in the time picker. Default false. */
  readonly showSeconds?: boolean;
  /** Initial time when none has been picked. Defaults to 00:00:00. */
  readonly initialTime?: { hour: number; minute: number; second?: number };
  /** Minimum allowed time-of-day (inclusive). Out-of-range setTime calls are clamped. */
  readonly minTime?: { hour: number; minute: number; second?: number };
  /** Maximum allowed time-of-day (inclusive). */
  readonly maxTime?: { hour: number; minute: number; second?: number };
  /**
   * Render month + year `<select>` dropdowns in the header instead of a single
   * clickable title. Lets the user jump to any year/month in one click.
   */
  readonly headerSelectors?: boolean;
  /**
   * Explicit year range for the year dropdown. Defaults to focused-year ± 100
   * (clamped by `min`/`max` if those are set).
   */
  readonly yearRange?: readonly [number, number];
}
