import type { CalendarDate } from '../domain/calendar-date.js';
import type { MonthGrid } from '../domain/month-grid.js';
import type { ViewMode } from '../navigation/view-mode.js';
import type { SelectionValue } from '../selection/selection-strategy.js';

export interface TimeOfDay {
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
}

export interface EngineState {
  readonly mode: SelectionValue['mode'];
  readonly view: ViewMode;
  /** Date currently receiving roving focus. Always present, even before any selection. */
  readonly focused: CalendarDate;
  readonly selection: SelectionValue;
  readonly grid: MonthGrid;
  readonly isOpen: boolean;
  /** Tentative range cursor — only meaningful in `range` mode after anchor is set. */
  readonly hovered: CalendarDate | null;
  /** Time-of-day portion when `withTime` is enabled. */
  readonly time: TimeOfDay | null;
}
