/**
 * @anil-labs/core — Headless, framework-agnostic calendar/date-picker engine.
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
  toEpochDay,
  fromEpochDay,
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
export type { PeriodCell, PeriodGrid } from './domain/period-grid.js';
export { buildPeriodGrid } from './domain/period-grid.js';

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
export { parseDate, resolveTwoDigitYear } from './i18n/parser.js';
export {
  encodeSelectionValue,
  decodeSelectionValue,
  formatSelection,
  parseSelection,
  type DecodedSelection,
  type FormatSelectionOptions,
} from './i18n/value-codec.js';
export {
  formatWithPattern,
  parseWithPattern,
  parseDateTimeWithPattern,
  resolvePattern,
  type FormatPreset,
  type ParsedDateTime,
  type TimeOfDay,
} from './i18n/pattern.js';
export { applyMask, isMaskable, type MaskResult } from './i18n/mask.js';
export { usHolidays, ukHolidays, npHolidays, composeHolidays } from './holidays/index.js';
export type {
  DateHighlight,
  InitialSelected,
  SelectionGranularity,
} from './engine/engine-options.js';
export {
  BUILTIN_PRESETS,
  resolvePreset,
  resolvePresets,
  type DatePreset,
  type PresetSpec,
} from './engine/preset.js';
export { isoWeekOfYear } from './domain/iso-week.js';
export { activateFocusTrap, announce, type FocusTrap } from './a11y/index.js';

export type { KeyboardAction } from './focus/keyboard-action.js';
export { interpretKey, type KeyboardEventLike } from './focus/keyboard-controller.js';

export { EventBus, type EventListener, type Unsubscribe } from './events/event-bus.js';

export { DatePickerEngine, type DatePickerEvents } from './engine/date-picker-engine.js';
export type { DatePickerEngineOptions } from './engine/engine-options.js';
export type { EngineState } from './engine/engine-state.js';

// --- Calendar systems (AD / BS) --------------------------------------------
export type { CalendarId, CalendarSystem } from './calendar/calendar-system.js';
export { GregorianCalendar } from './calendar/gregorian-calendar.js';
export { BikramSambatCalendar } from './calendar/bikram-sambat-calendar.js';
export { BuddhistCalendar } from './calendar/buddhist-calendar.js';
export { PersianCalendar } from './calendar/persian-calendar.js';
export { createCalendarSystem } from './calendar/calendar-factory.js';
export {
  BS_EPOCH_GREGORIAN,
  BS_MAX_YEAR,
  BS_MIN_YEAR,
  BS_MONTH_DAYS,
  BS_MONTH_NAMES_EN,
  BS_MONTH_NAMES_NE,
  toDevanagariDigits,
} from './calendar/bikram-sambat-data.js';
