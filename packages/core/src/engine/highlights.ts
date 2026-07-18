import { type CalendarDate, toIso } from '../domain';
import type { DateHighlight } from './engine-options.js';

/**
 * O(1)-per-cell lookup for date highlights. Indexed by the calendar-agnostic
 * `YYYY-MM-DD` key so any CalendarDate value is comparable.
 */
export class HighlightIndex {
  readonly #map: ReadonlyMap<string, DateHighlight>;

  constructor(items: ReadonlyArray<DateHighlight> = []) {
    const m = new Map<string, DateHighlight>();
    for (const item of items) m.set(toIso(item.date), item);
    this.#map = m;
  }

  get(date: CalendarDate): DateHighlight | undefined {
    return this.#map.get(toIso(date));
  }

  get size(): number {
    return this.#map.size;
  }
}
