import type { CalendarDate } from '../domain/calendar-date.js';
import type { DateRange } from '../domain/date-range.js';

export type SelectionMode = 'single' | 'range' | 'multi';

export type SelectionValue =
  | { readonly mode: 'single'; readonly value: CalendarDate | null }
  | { readonly mode: 'range'; readonly value: DateRange | null; readonly anchor: CalendarDate | null }
  | { readonly mode: 'multi'; readonly value: ReadonlyArray<CalendarDate> };

/**
 * Strategy for accumulating user clicks into a selection value. Each
 * implementation owns its own state-transition rules but exposes the same
 * minimal interface to the engine, satisfying LSP.
 */
export interface SelectionStrategy<S extends SelectionValue = SelectionValue> {
  readonly mode: S['mode'];
  /** Initial empty value. */
  initial(): S;
  /** User clicked a date — return the new selection value. */
  select(state: S, date: CalendarDate): S;
  /** Clear the selection. */
  clear(state: S): S;
  /** True if `date` participates in `state`'s current value. */
  isSelected(state: S, date: CalendarDate): boolean;
  /** True when state contains a value the consumer would consider "complete". */
  isComplete(state: S): boolean;
}
