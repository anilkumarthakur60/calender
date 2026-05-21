import type { CalendarDate } from '../domain/calendar-date.js';
import { compareDates, isSameDay } from '../domain/calendar-date.js';
import type { SelectionStrategy, SelectionValue } from './selection-strategy.js';

type S = Extract<SelectionValue, { mode: 'multi' }>;

export interface MultiSelectionOptions {
  /** Maximum number of selected dates. Older selections are dropped FIFO. */
  readonly max?: number;
}

export class MultiSelectionStrategy implements SelectionStrategy<S> {
  readonly mode = 'multi' as const;
  readonly #options: MultiSelectionOptions;

  constructor(options: MultiSelectionOptions = {}) {
    this.#options = options;
  }

  initial(): S {
    return { mode: 'multi', value: [] };
  }

  select(state: S, date: CalendarDate): S {
    const has = state.value.some(d => isSameDay(d, date));
    if (has) {
      return { mode: 'multi', value: state.value.filter(d => !isSameDay(d, date)) };
    }
    const next = [...state.value, date].sort(compareDates);
    const trimmed =
      this.#options.max !== undefined && next.length > this.#options.max
        ? next.slice(next.length - this.#options.max)
        : next;
    return { mode: 'multi', value: trimmed };
  }

  clear(_state: S): S {
    return { mode: 'multi', value: [] };
  }

  isSelected(state: S, date: CalendarDate): boolean {
    return state.value.some(d => isSameDay(d, date));
  }

  isComplete(state: S): boolean {
    return state.value.length > 0;
  }
}
