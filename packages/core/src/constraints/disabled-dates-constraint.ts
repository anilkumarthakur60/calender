import type { CalendarDate } from '../domain/calendar-date.js';
import { toIso } from '../domain/calendar-date.js';
import type { DateConstraint } from './constraint.js';

export class DisabledDatesConstraint implements DateConstraint {
  readonly #set: ReadonlySet<string>;

  constructor(dates: Iterable<CalendarDate>) {
    this.#set = new Set([...dates].map(toIso));
  }

  evaluate(date: CalendarDate): string | null {
    return this.#set.has(toIso(date)) ? 'disabled-date' : null;
  }
}
