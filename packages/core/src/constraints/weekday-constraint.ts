import { type CalendarSystem, GregorianCalendar } from '../calendar';
import type { CalendarDate } from '../domain';
import type { DateConstraint } from './constraint.js';

export class DisabledWeekdayConstraint implements DateConstraint {
  readonly #set: ReadonlySet<number>;
  readonly #calendar: CalendarSystem;

  constructor(weekdays: Iterable<number>, calendar: CalendarSystem = new GregorianCalendar()) {
    this.#set = new Set(weekdays);
    this.#calendar = calendar;
  }

  evaluate(date: CalendarDate): string | null {
    return this.#set.has(this.#calendar.weekday(date)) ? 'disabled-weekday' : null;
  }
}
