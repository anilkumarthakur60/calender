import type { CalendarSystem } from '../calendar/calendar-system.js';
import { GregorianCalendar } from '../calendar/gregorian-calendar.js';
import type { CalendarDate } from '../domain/calendar-date.js';
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
