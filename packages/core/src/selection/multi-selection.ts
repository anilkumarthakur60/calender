import { type CalendarDate, compareDates, isSameDay } from '../domain';
import type { SelectionStrategy, SelectionValue } from './selection-strategy.js';

type S = Extract<SelectionValue, { mode: 'multi' }>;

export interface MultiSelectionOptions {
  /** Maximum number of selected dates. Older selections are dropped FIFO. */
  readonly max?: number;
}

export class MultiSelectionStrategy implements SelectionStrategy<S> {
  readonly mode = 'multi' as const;
  readonly #options: MultiSelectionOptions;
  /**
   * Insertion-order bookkeeping so max-cap trimming drops the OLDEST-SELECTED
   * date (FIFO), not the chronologically earliest. The exposed `value` stays
   * sorted by date — only the trim order tracks selection order.
   */
  #order: CalendarDate[] = [];

  constructor(options: MultiSelectionOptions = {}) {
    this.#options = options;
  }

  initial(): S {
    this.#order = [];
    return { mode: 'multi', value: [] };
  }

  select(state: S, date: CalendarDate): S {
    // Resync bookkeeping with the incoming state (it may have been seeded or
    // pruned externally); unknown dates count as oldest in array order.
    this.#order = this.#order.filter(d => state.value.some(v => isSameDay(v, d)));
    for (const v of state.value) {
      if (!this.#order.some(d => isSameDay(d, v))) this.#order.push(v);
    }

    const has = state.value.some(d => isSameDay(d, date));
    if (has) {
      this.#order = this.#order.filter(d => !isSameDay(d, date));
      return { mode: 'multi', value: state.value.filter(d => !isSameDay(d, date)) };
    }
    this.#order.push(date);
    if (this.#options.max !== undefined && this.#order.length > this.#options.max) {
      this.#order = this.#order.slice(this.#order.length - this.#options.max);
    }
    return { mode: 'multi', value: [...this.#order].sort(compareDates) };
  }

  clear(_state: S): S {
    this.#order = [];
    return { mode: 'multi', value: [] };
  }

  isSelected(state: S, date: CalendarDate): boolean {
    return state.value.some(d => isSameDay(d, date));
  }

  isComplete(state: S): boolean {
    return state.value.length > 0;
  }
}
