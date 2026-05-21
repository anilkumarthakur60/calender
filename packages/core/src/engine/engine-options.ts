import type { CalendarDate } from '../domain/calendar-date.js';
import type { DateConstraint } from '../constraints/constraint.js';
import type { LocaleConfig } from '../i18n/locale-config.js';
import type { ViewMode } from '../navigation/view-mode.js';
import type { SelectionMode } from '../selection/selection-strategy.js';
import type { RangeSelectionOptions } from '../selection/range-selection.js';
import type { MultiSelectionOptions } from '../selection/multi-selection.js';

export interface DatePickerEngineOptions {
  readonly mode?: SelectionMode;
  readonly initialFocused?: CalendarDate;
  readonly initialView?: ViewMode;
  readonly min?: CalendarDate;
  readonly max?: CalendarDate;
  readonly disabledDates?: ReadonlyArray<CalendarDate>;
  readonly disabledWeekdays?: ReadonlyArray<number>;
  readonly extraConstraints?: ReadonlyArray<DateConstraint>;
  readonly locale?: string | Partial<LocaleConfig>;
  readonly range?: RangeSelectionOptions;
  readonly multi?: MultiSelectionOptions;
  readonly fixedWeeks?: boolean;
}
