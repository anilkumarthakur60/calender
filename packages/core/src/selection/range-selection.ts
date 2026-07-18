import { type CalendarDate, isSameDay, createRange, isInRange } from '../domain';
import type { SelectionStrategy, SelectionValue } from './selection-strategy.js';

type S = Extract<SelectionValue, { mode: 'range' }>;

export interface RangeSelectionOptions {
  /** When true, a second click on the same date as the anchor produces a 1-day range. */
  readonly allowSingleDayRange?: boolean;
}

export class RangeSelectionStrategy implements SelectionStrategy<S> {
  readonly mode = 'range' as const;
  readonly #options: Required<RangeSelectionOptions>;

  constructor(options: RangeSelectionOptions = {}) {
    this.#options = { allowSingleDayRange: options.allowSingleDayRange ?? true };
  }

  initial(): S {
    return { mode: 'range', value: null, anchor: null };
  }

  select(state: S, date: CalendarDate): S {
    if (state.anchor === null || state.value !== null) {
      return { mode: 'range', value: null, anchor: date };
    }
    if (isSameDay(state.anchor, date) && !this.#options.allowSingleDayRange) {
      return { mode: 'range', value: null, anchor: null };
    }
    return { mode: 'range', value: createRange(state.anchor, date), anchor: state.anchor };
  }

  clear(_state: S): S {
    return { mode: 'range', value: null, anchor: null };
  }

  isSelected(state: S, date: CalendarDate): boolean {
    if (state.value) return isInRange(date, state.value, true);
    if (state.anchor) return isSameDay(state.anchor, date);
    return false;
  }

  isComplete(state: S): boolean {
    return state.value !== null;
  }
}
