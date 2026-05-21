import type { CalendarDate } from '../domain/calendar-date.js';
import { usWeekday } from '../domain/calendar-date.js';
import type { DateConstraint } from './constraint.js';

export class DisabledWeekdayConstraint implements DateConstraint {
  readonly #set: ReadonlySet<number>;

  constructor(weekdays: Iterable<number>) {
    this.#set = new Set(weekdays);
  }

  evaluate(date: CalendarDate): string | null {
    return this.#set.has(usWeekday(date)) ? 'disabled-weekday' : null;
  }
}
