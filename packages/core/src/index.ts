/**
 * @calender/core — Headless, framework-agnostic calendar/date-picker engine.
 *
 * Public surface (barrel). Internal modules are intentionally NOT re-exported;
 * downstream packages should import from this entry point to get a stable API.
 */

export type { CalendarDate } from './domain/calendar-date.js';
export {
  createCalendarDate,
  fromIso,
  fromJsDate,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isSameYear,
  todayCalendarDate,
  toIso,
  toJsDate,
  addDays,
  addMonths,
  addYears,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  daysInMonth,
  isLeapYear,
  isoWeekday,
  usWeekday,
} from './domain/calendar-date.js';

export type { DateRange } from './domain/date-range.js';
export { createRange, isInRange, isRangeStart, isRangeEnd } from './domain/date-range.js';

export type {
  MonthGrid,
  MonthGridCell,
  MonthGridOptions,
  WeekdayStart,
} from './domain/month-grid.js';
export { buildMonthGrid } from './domain/month-grid.js';

export type {
  SelectionMode,
  SelectionStrategy,
  SelectionValue,
} from './selection/selection-strategy.js';
export { SingleSelectionStrategy } from './selection/single-selection.js';
export { RangeSelectionStrategy, type RangeSelectionOptions } from './selection/range-selection.js';
export { MultiSelectionStrategy, type MultiSelectionOptions } from './selection/multi-selection.js';
export { createSelectionStrategy } from './selection/selection-factory.js';

export type { DateConstraint } from './constraints/constraint.js';
export { MinMaxConstraint } from './constraints/min-max-constraint.js';
export { DisabledDatesConstraint } from './constraints/disabled-dates-constraint.js';
export { DisabledWeekdayConstraint } from './constraints/weekday-constraint.js';
export { FilterConstraint, type DateFilterPredicate } from './constraints/filter-constraint.js';
export { CompositeConstraint } from './constraints/composite-constraint.js';

export type { ViewMode } from './navigation/view-mode.js';
export { drillDown, drillUp, VIEW_HIERARCHY } from './navigation/view-mode.js';
export { stepBackward, stepForward, type NavigationBounds } from './navigation/view-navigator.js';

export type { LocaleConfig } from './i18n/locale-config.js';
export { resolveLocaleConfig } from './i18n/locale-config.js';
export { DateFormatter } from './i18n/formatter.js';
export { parseDate } from './i18n/parser.js';

export type { KeyboardAction } from './focus/keyboard-action.js';
export { interpretKey, type KeyboardEventLike } from './focus/keyboard-controller.js';

export { EventBus, type EventListener, type Unsubscribe } from './events/event-bus.js';

export { DatePickerEngine, type DatePickerEvents } from './engine/date-picker-engine.js';
export type { DatePickerEngineOptions } from './engine/engine-options.js';
export type { EngineState } from './engine/engine-state.js';
